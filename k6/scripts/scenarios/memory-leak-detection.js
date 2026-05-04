import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config } from '../lib/config.js';
import {
  authenticate,
  logout,
  randomFloat,
  generateTeamUserId,
  getAuthHeaders,
  getUserTeams,
  getActiveSprint,
  getTeamInsights,
  getSprintTasks,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const memoryTrend = new Trend('memory_trend');
const loginLogoutCycles = new Counter('login_logout_cycles');

export const options = {
  scenarios: {
    memory_leak_detection: {
      executor: 'constant-vus',
      vus: 30,
      duration: '72h',
      gracefulStop: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

export default function memoryLeakDetection() {
  const { teamNum, email } = generateTeamUserId(__VU, 10, 15);

  for (let i = 0; i < 10; i++) {
    const { token, jar } = authenticate(email, 'LoadTest123!');

    if (token) {
      const headers = getAuthHeaders(token, null);
      http.post(`${config.baseUrl}/api/v1/auth/logout`, {}, { headers, jar });
    }

    sleep(1);
  }

  loginLogoutCycles.add(1);

  const { token, csrfToken, csrfCookie, jar } = authenticate(email, 'LoadTest123!');

  if (!token) {
    errorRate.add(1);
    recordError('auth', true);
    sleep(10);
    return;
  }

  recordOperation('login');

  const headers = getAuthHeaders(token, csrfToken);

  const teams = getUserTeams(token, csrfToken, jar);
  if (!teams || teams.length === 0) {
    recordError('api', true);
    logout(token, csrfToken, csrfCookie);
    return;
  }
  const team = teams[0];
  const teamId = team.id;

  const sprint = getActiveSprint(teamId, token, csrfToken, jar);
  const sprintId = sprint?.id;

  for (let i = 0; i < 5; i++) {
    const insightsRes = http.get(`${config.baseUrl}/api/v1/reports/insights/${teamId}`, {
      headers,
      jar,
      tags: { operation: 'getInsights' },
    });

    check(insightsRes, {
      'insights loaded': (r) => r.status === 200,
    });

    recordResponseTime('report', insightsRes.timings.duration);
    responseTime.add(insightsRes.timings.duration);
    requestCount.add(1);

    memoryTrend.add(insightsRes.timings.duration);

    sleep(randomFloat(3, 8));
  }

  if (sprintId) {
    const boardRes = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/tasks`, {
      headers,
      jar,
      tags: { operation: 'getBoard' },
    });

    check(boardRes, {
      'board loaded': (r) => r.status === 200,
    });

    requestCount.add(1);
  }

  sleep(randomFloat(5, 15));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');

  sleep(randomFloat(30, 60));
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const totalLoginLogoutCycles = data.metrics.login_logout_cycles?.values?.count || 0;

  const memoryTrendValues = data.metrics.memory_trend?.values || {};
  const avgResponseTime = memoryTrendValues.avg || 0;
  const maxResponseTime = memoryTrendValues.max || 0;

  const possibleMemoryLeak = maxResponseTime > avgResponseTime * 2;

  return {
    stdout: `
========================================
72-Hour Memory Leak Detection Test Summary
========================================
Duration: 72 hours
Virtual Users: 30
Login/Logout Cycles: ${totalLoginLogoutCycles}

Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Memory Leak Analysis:
  - Avg response time: ${avgResponseTime.toFixed(2)}ms
  - Max response time: ${maxResponseTime.toFixed(2)}ms
  - Response time variance: ${possibleMemoryLeak ? 'HIGH (possible leak)' : 'Normal'}

Stability Indicators:
  - P95 < 500ms: ${p95 < 500 ? 'PASS' : 'FAIL'}
  - Error Rate < 1%: ${errorRateValue < 1 ? 'PASS' : 'FAIL'}
  - No memory leak detected: ${!possibleMemoryLeak ? 'PASS' : 'WARN'}

Overall Status: ${p95 < 500 && errorRateValue < 1 && !possibleMemoryLeak ? 'PASS' : 'WARN'}
========================================
`,
    'k6/results/memory-leak-detection-summary.json': JSON.stringify(data, null, 2),
  };
}
