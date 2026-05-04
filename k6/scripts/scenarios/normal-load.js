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
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

export const options = {
  stages: [
    { duration: '2m', target: 5 },
    { duration: '5m', target: 10 },
    { duration: '10m', target: 15 },
    { duration: '5m', target: 10 },
    { duration: '2m', target: 0 },
  ],
  thresholds: thresholds.development,
};

export default function normalLoadTest() {
  const { teamNum, userNum, email } = generateTeamUserId(__VU, 5, 10);

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

  const sprintRes = http.get(`${config.baseUrl}/api/v1/sprints/active?teamId=${teamId}`, {
    headers,
    jar,
  });

  check(sprintRes, {
    'sprint loaded': (r) => r.status === 200,
    'sprint response time OK': (r) => r.timings.duration < 300,
  });

  recordResponseTime('sprint', sprintRes.timings.duration);
  responseTime.add(sprintRes.timings.duration);
  requestCount.add(1);
  recordError('api', sprintRes.status !== 200);

  sleep(randomFloat(2, 5));

  const sprintBody = sprintRes.json();
  const sprint = sprintBody?.data?.sprint;

  if (sprint && sprint.id) {
    const boardRes = http.get(`${config.baseUrl}/api/v1/sprints/${sprint.id}/tasks`, {
      headers,
      jar,
    });

    check(boardRes, {
      'board loaded': (r) => r.status === 200,
      'board response time OK': (r) => r.timings.duration < 400,
    });

    recordResponseTime('task', boardRes.timings.duration);
    responseTime.add(boardRes.timings.duration);
    requestCount.add(1);
  }

  sleep(randomFloat(5, 15));

  if (Math.random() < 0.3) {
    const backlogRes = http.get(`${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}`, {
      headers,
      jar,
    });

    check(backlogRes, {
      'backlog loaded': (r) => r.status === 200,
    });

    recordResponseTime('backlog', backlogRes.timings.duration);
    requestCount.add(1);

    sleep(randomFloat(3, 8));
  }

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');

  sleep(randomFloat(1, 5));
}

export function handleSummary(data) {
  return {
    stdout: `
========================================
Normal Load Test Summary
========================================
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%

Status: ${data.metrics.http_req_duration?.values?.['p(95)'] < 1000 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/normal-load-summary.json': JSON.stringify(data, null, 2),
  };
}
