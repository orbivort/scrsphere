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
  getSprintTasks,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const breakingPointVus = new Counter('breaking_point_vus');

let breakingPointFound = false;
let breakingPointVusValue = 0;

export const options = {
  stages: [
    { duration: '5m', target: 20 },
    { duration: '5m', target: 40 },
    { duration: '5m', target: 60 },
    { duration: '5m', target: 80 },
    { duration: '5m', target: 100 },
    { duration: '5m', target: 120 },
    { duration: '5m', target: 150 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {},
};

export default function breakingPointTest() {
  const { teamNum, email } = generateTeamUserId(__VU, 10, 15);

  const { token, csrfToken, csrfCookie, jar } = authenticate(email, 'LoadTest123!');

  if (!token) {
    errorRate.add(1);
    recordError('auth', true);

    if (!breakingPointFound) {
      breakingPointFound = true;
      breakingPointVusValue = __VU;
      breakingPointVus.add(__VU);
      console.log(`Potential breaking point detected at ${__VU} VUs - authentication failures`);
    }

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
  if (!sprint || !sprint.id) {
    recordError('api', true);
    logout(token, csrfToken, csrfCookie);
    return;
  }
  const sprintId = sprint.id;

  const isRead = Math.random() < 0.7;

  if (isRead) {
    const endpoints = [
      () =>
        http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/tasks`, {
          headers,
          jar,
          tags: { operation: 'getTasks' },
        }),
      () =>
        http.get(`${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}`, {
          headers,
          jar,
          tags: { operation: 'getBacklog' },
        }),
      () =>
        http.get(`${config.baseUrl}/api/v1/sprints/active?teamId=${teamId}`, {
          headers,
          jar,
          tags: { operation: 'getActiveSprint' },
        }),
    ];

    const res = endpoints[Math.floor(Math.random() * endpoints.length)]();

    check(res, {
      'read successful': (r) => r.status === 200,
    });

    recordResponseTime('sprint', res.timings.duration);
    responseTime.add(res.timings.duration);
    requestCount.add(1);

    if (res.status >= 500 && !breakingPointFound) {
      breakingPointFound = true;
      breakingPointVusValue = __VU;
      breakingPointVus.add(__VU);
      console.log(`Breaking point detected at ${__VU} VUs - server errors`);
    }
  } else {
    const tasks = getSprintTasks(sprintId, token, csrfToken, jar);
    const taskId = tasks.length > 0 ? tasks[Math.floor(Math.random() * tasks.length)].id : null;

    if (taskId) {
      const taskUpdateRes = http.put(
        `${config.baseUrl}/api/v1/sprints/${sprintId}/tasks/${taskId}`,
        JSON.stringify({
          status: ['TODO', 'IN_PROGRESS', 'DONE'][Math.floor(Math.random() * 3)],
        }),
        { headers, jar, tags: { operation: 'updateTask' } }
      );

      check(taskUpdateRes, {
        'write successful': (r) => r.status === 200 || r.status === 404,
      });

      recordResponseTime('task', taskUpdateRes.timings.duration);
      responseTime.add(taskUpdateRes.timings.duration);
      requestCount.add(1);
      recordError('api', taskUpdateRes.status >= 500);
    }
  }

  sleep(randomFloat(0.5, 2));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const p99 = data.metrics.http_req_duration?.values?.['p(99)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const maxVus = data.metrics.vus?.values?.max || 0;

  let breakingPoint = 'Not detected';
  if (breakingPointVusValue > 0) {
    breakingPoint = `${breakingPointVusValue} VUs`;
  } else if (errorRateValue > 5) {
    breakingPoint = `~${maxVus} VUs (error rate > 5%)`;
  }

  return {
    stdout: `
========================================
Breaking Point Discovery Test Summary
========================================
Max Virtual Users: ${maxVus}
Breaking Point: ${breakingPoint}

Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${p99.toFixed(2)}ms
  - Max: ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Analysis:
  - System handled up to ${maxVus} concurrent users
  - P95 response time: ${p95 < 1000 ? 'Acceptable' : 'Degraded'}
  - Error rate: ${errorRateValue < 5 ? 'Acceptable' : 'High'}

Recommendations:
  ${p95 > 1000 ? '- Response times degraded - consider optimization\n' : ''}
  ${errorRateValue > 5 ? '- High error rate - investigate error causes\n' : ''}
  ${maxVus >= 150 ? '- System scales well under load\n' : ''}
========================================
`,
    'k6/results/breaking-point-summary.json': JSON.stringify(data, null, 2),
  };
}
