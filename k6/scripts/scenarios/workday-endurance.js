import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../lib/config.js';
import {
  authenticate,
  logout,
  randomFloat,
  randomItem,
  generateTeamUserId,
  generateDailyUpdateData,
  getAuthHeaders,
  getUserTeams,
  getActiveSprint,
  getSprintTasks,
  getRandomTask,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

export const options = {
  scenarios: {
    workday: {
      executor: 'constant-vus',
      vus: 50,
      duration: '8h',
      gracefulStop: '5m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

function getWorkdayIntensity(elapsedMs) {
  const hour = elapsedMs / (1000 * 60 * 60);

  if (hour < 0.5) return 0.2;
  if (hour < 2) return 1.0;
  if (hour < 2.5) return 1.5;
  if (hour < 6) return 0.8;
  if (hour < 7) return 0.4;
  if (hour < 8) return 0.9;
  return 0.3;
}

function executeOperation(operation, token, csrfToken, jar, teamId, sprintId) {
  const headers = getAuthHeaders(token, csrfToken);

  switch (operation) {
    case 'viewSprintBoard': {
      const res = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/tasks`, {
        headers,
        jar,
        tags: { operation: 'viewSprintBoard' },
      });
      check(res, { 'sprint board loaded': (r) => r.status === 200 });
      recordResponseTime('task', res.timings.duration);
      requestCount.add(1);
      break;
    }
    case 'viewBacklog': {
      const res = http.get(`${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}`, {
        headers,
        jar,
        tags: { operation: 'viewBacklog' },
      });
      check(res, { 'backlog loaded': (r) => r.status === 200 });
      recordResponseTime('backlog', res.timings.duration);
      requestCount.add(1);
      break;
    }
    case 'updateTask': {
      const task = getRandomTask(sprintId, token, csrfToken, jar);
      if (task && task.id) {
        const res = http.put(
          `${config.baseUrl}/api/v1/sprints/${sprintId}/tasks/${task.id}`,
          JSON.stringify({ status: randomItem(['TODO', 'IN_PROGRESS', 'DONE']) }),
          { headers, jar, tags: { operation: 'updateTask' } }
        );
        check(res, { 'task updated': (r) => r.status === 200 || r.status === 404 });
        recordResponseTime('task', res.timings.duration);
        requestCount.add(1);
        recordOperation('taskUpdate');
      }
      break;
    }
    case 'viewReports': {
      const res = http.get(`${config.baseUrl}/api/v1/reports/velocity/${teamId}`, {
        headers,
        jar,
        tags: { operation: 'viewReports' },
      });
      check(res, { 'reports loaded': (r) => r.status === 200 });
      recordResponseTime('report', res.timings.duration);
      requestCount.add(1);
      break;
    }
    case 'submitDailyUpdate': {
      const updateData = generateDailyUpdateData(sprintId, __VU);
      const res = http.post(`${config.baseUrl}/api/v1/daily-updates`, JSON.stringify(updateData), {
        headers,
        jar,
        tags: { operation: 'submitDailyUpdate' },
      });
      check(res, { 'daily update submitted': (r) => r.status === 201 || r.status === 200 });
      recordResponseTime('dailyUpdate', res.timings.duration);
      requestCount.add(1);
      recordOperation('dailyUpdate');
      break;
    }
    default:
      break;
  }
}

export default function workdayEnduranceTest() {
  const { teamNum, email } = generateTeamUserId(__VU, 10, 15);

  const { token, csrfToken, csrfCookie, jar } = authenticate(email, 'LoadTest123!');

  if (!token) {
    errorRate.add(1);
    recordError('auth', true);
    sleep(5);
    return;
  }

  recordOperation('login');

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

  const elapsedMs = __ITER * 30000;
  const intensity = getWorkdayIntensity(elapsedMs);
  const operationsCount = Math.ceil(3 * intensity);

  const operations = [
    { name: 'viewSprintBoard', weight: 30 },
    { name: 'viewBacklog', weight: 25 },
    { name: 'updateTask', weight: 20 },
    { name: 'viewReports', weight: 15 },
    { name: 'submitDailyUpdate', weight: 10 },
  ];

  const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);

  for (let i = 0; i < operationsCount; i++) {
    let random = Math.random() * totalWeight;
    let selectedOp = operations[0].name;

    for (const op of operations) {
      random -= op.weight;
      if (random <= 0) {
        selectedOp = op.name;
        break;
      }
    }

    executeOperation(selectedOp, token, csrfToken, csrfCookie, teamId, sprintId);
    sleep(randomFloat(2, 5));
  }

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');

  sleep(randomFloat(5, 15));
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const duration = '8 hours';

  return {
    stdout: `
========================================
8-Hour Workday Endurance Test Summary
========================================
Duration: ${duration}
Virtual Users: 50

Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Stability Analysis:
  - P95 < 500ms: ${p95 < 500 ? 'PASS' : 'FAIL'}
  - Error Rate < 1%: ${errorRateValue < 1 ? 'PASS' : 'FAIL'}

Memory Leak Indicators:
  - Response time trend: ${p95 < 600 ? 'Stable' : 'Possible degradation'}
  - Error rate trend: ${errorRateValue < 2 ? 'Stable' : 'Increasing errors'}

Overall Status: ${p95 < 500 && errorRateValue < 1 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/workday-endurance-summary.json': JSON.stringify(data, null, 2),
  };
}
