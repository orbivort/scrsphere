import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../lib/config.js';
import {
  authenticate,
  logout,
  randomFloat,
  generateTeamUserId,
  generateDailyScrumData,
  getAuthHeaders,
  getUserTeams,
  getActiveSprint,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const dailyScrumsCreated = new Counter('daily_scrums_created');

export const options = {
  scenarios: {
    daily_scrum_rush: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { duration: '30s', target: 2 },
        { duration: '2m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '30s', target: 1 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<500'],
    http_req_failed: ['rate<0.005'],
    errors: ['rate<0.005'],
  },
};

export default function dailyScrumRush() {
  const { teamNum, email } = generateTeamUserId(__VU, 1, 15);

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
  if (!sprint || !sprint.id) {
    recordError('api', true);
    logout(token, csrfToken, csrfCookie);
    return;
  }
  const sprintId = sprint.id;

  const scrumData = generateDailyScrumData(sprintId, __VU);

  const createRes = http.post(
    `${config.baseUrl}/api/v1/daily-scrums/${sprintId}`,
    JSON.stringify(scrumData),
    { headers, jar, tags: { operation: 'createDailyScrum' } }
  );

  check(createRes, {
    'daily scrum created': (r) => r.status === 201 || r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 300,
  });

  recordResponseTime('dailyScrum', createRes.timings.duration);
  responseTime.add(createRes.timings.duration);
  requestCount.add(1);

  let scrumId = null;
  if (createRes.status === 201 || createRes.status === 200) {
    dailyScrumsCreated.add(1);
    recordOperation('dailyScrum');
    const body = createRes.json();
    scrumId = body?.data?.id || null;
  }

  recordError('api', createRes.status >= 400);

  sleep(randomFloat(1, 3));

  const listRes = http.get(`${config.baseUrl}/api/v1/daily-scrums/${sprintId}`, {
    headers,
    jar,
    tags: { operation: 'listDailyScrums' },
  });

  check(listRes, {
    'daily scrums listed': (r) => r.status === 200,
  });

  requestCount.add(1);

  if (scrumId) {
    const participateRes = http.post(
      `${config.baseUrl}/api/v1/daily-scrums/record/${scrumId}/participate`,
      null,
      { headers, jar, tags: { operation: 'participateDailyScrum' } }
    );
    check(participateRes, {
      'participation recorded': (r) => r.status === 201 || r.status === 200,
    });
    requestCount.add(1);
  }

  sleep(randomFloat(2, 5));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;

  return {
    stdout: `
========================================
Daily Scrum Rush Test Summary
========================================
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s
Daily Scrums Created: ${data.metrics.daily_scrums_created?.values?.count || 0}

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Thresholds:
  - P95 < 300ms: ${p95 < 300 ? 'PASS' : 'FAIL'}
  - Error Rate < 0.5%: ${errorRateValue < 0.5 ? 'PASS' : 'FAIL'}

Overall Status: ${p95 < 300 && errorRateValue < 0.5 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/daily-scrum-rush-summary.json': JSON.stringify(data, null, 2),
  };
}
