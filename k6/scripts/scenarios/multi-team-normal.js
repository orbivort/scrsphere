import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, thresholds } from '../lib/config.js';
import {
  authenticate,
  logout,
  randomFloat,
  generateTeamUserId,
  getAuthHeaders,
  getUserTeams,
  getActiveSprint,
  getSprintTasks,
  getProductBacklog,
  getTeamVelocity,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

const NUM_TEAMS = 10;

export const options = {
  scenarios: {
    team_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 50 },
        { duration: '15m', target: 150 },
        { duration: '5m', target: 150 },
        { duration: '3m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

export default function multiTeamNormalLoad() {
  const { teamNum, userNum, email } = generateTeamUserId(__VU, NUM_TEAMS, 15);

  const { token, csrfToken, csrfCookie, jar } = authenticate(email, 'LoadTest123!');

  if (!token) {
    errorRate.add(1);
    recordError('auth', true);
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

  const operations = [
    () => {
      const res = http.get(`${config.baseUrl}/api/v1/sprints/active?teamId=${teamId}`, {
        headers,
        jar,
        tags: { operation: 'getActiveSprint', team: teamId },
      });
      check(res, { 'get active sprint': (r) => r.status === 200 });
      recordResponseTime('sprint', res.timings.duration);
      requestCount.add(1);
      return res;
    },
    () => {
      if (!sprintId) return null;
      const res = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/tasks`, {
        headers,
        jar,
        tags: { operation: 'getTasks', team: teamId },
      });
      check(res, { 'get tasks': (r) => r.status === 200 });
      recordResponseTime('task', res.timings.duration);
      requestCount.add(1);
      return res;
    },
    () => {
      const res = http.get(`${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}`, {
        headers,
        jar,
        tags: { operation: 'getBacklog', team: teamId },
      });
      check(res, { 'get backlog': (r) => r.status === 200 });
      recordResponseTime('backlog', res.timings.duration);
      requestCount.add(1);
      return res;
    },
    () => {
      const res = http.get(`${config.baseUrl}/api/v1/reports/velocity/${teamId}`, {
        headers,
        jar,
        tags: { operation: 'getVelocity', team: teamId },
      });
      check(res, { 'get velocity': (r) => r.status === 200 });
      recordResponseTime('report', res.timings.duration);
      requestCount.add(1);
      return res;
    },
  ];

  const weights = [35, 30, 20, 15];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < operations.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      operations[i]();
      break;
    }
  }

  sleep(randomFloat(2, 8));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;

  return {
    stdout: `
========================================
Multi-Team Normal Load Test Summary
========================================
Teams Simulated: ${NUM_TEAMS}
Total Requests: ${totalRequests}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Thresholds:
  - P95 < 600ms: ${p95 < 600 ? 'PASS' : 'FAIL'}
  - Error Rate < 1%: ${errorRateValue < 1 ? 'PASS' : 'FAIL'}

Overall Status: ${p95 < 600 && errorRateValue < 1 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/multi-team-normal-summary.json': JSON.stringify(data, null, 2),
  };
}
