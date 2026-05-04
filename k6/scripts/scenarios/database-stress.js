import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
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
  getTeamVelocity,
  getSprintBurndown,
  getProductBacklog,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const dbQueryCount = new Counter('db_queries');

export const options = {
  scenarios: {
    heavy_queries: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.02'],
  },
};

export default function databaseStressTest() {
  const { teamNum, email } = generateTeamUserId(__VU, 10, 15);

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

  const heavyEndpoints = [];

  heavyEndpoints.push({
    name: 'insights',
    url: `${config.baseUrl}/api/v1/reports/insights/${teamId}`,
    maxTime: 1000,
  });

  heavyEndpoints.push({
    name: 'velocity',
    url: `${config.baseUrl}/api/v1/reports/velocity/${teamId}`,
    maxTime: 800,
  });

  if (sprintId) {
    heavyEndpoints.push({
      name: 'burndown',
      url: `${config.baseUrl}/api/v1/sprints/${sprintId}/burndown`,
      maxTime: 600,
    });
  }

  heavyEndpoints.push({
    name: 'backlog_with_tasks',
    url: `${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}&include=tasks`,
    maxTime: 500,
  });

  for (const endpoint of heavyEndpoints) {
    const res = http.get(endpoint.url, {
      headers,
      jar,
      tags: { operation: endpoint.name, type: 'heavy_query' },
    });

    check(res, {
      [`${endpoint.name} successful`]: (r) => r.status === 200,
      [`${endpoint.name} response time OK`]: (r) => r.timings.duration < endpoint.maxTime,
    });

    recordResponseTime('report', res.timings.duration);
    responseTime.add(res.timings.duration);
    requestCount.add(1);
    dbQueryCount.add(1);
    recordError('db', res.status >= 500);

    sleep(randomFloat(0.5, 1.5));
  }

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');

  sleep(randomFloat(1, 3));
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const totalDbQueries = data.metrics.db_queries?.values?.count || 0;

  return {
    stdout: `
========================================
Database Stress Test Summary
========================================
Duration: 10 minutes
Virtual Users: 100
Total DB Queries: ${totalDbQueries}

Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Thresholds:
  - P95 < 1000ms: ${p95 < 1000 ? 'PASS' : 'FAIL'}
  - Error Rate < 2%: ${errorRateValue < 2 ? 'PASS' : 'FAIL'}

Database Performance:
  - Queries per second: ${(totalDbQueries / 600).toFixed(2)}
  - Avg query time: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms

Overall Status: ${p95 < 1000 && errorRateValue < 2 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/database-stress-summary.json': JSON.stringify(data, null, 2),
  };
}
