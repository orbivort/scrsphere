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
  getSprintBurndown,
  getTeamVelocity,
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '3m', target: 25 },
    { duration: '10m', target: 25 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

export default function sprintReviewPeak() {
  const { teamNum, userNum, email } = generateTeamUserId(__VU, 1, 25);

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

  const isStakeholder = userNum > 15;

  if (!isStakeholder) {
    const reviewRes = http.get(`${config.baseUrl}/api/v1/sprint-reviews/review-${teamNum}-1`, {
      headers,
      jar,
      tags: { operation: 'getSprintReview' },
    });

    check(reviewRes, {
      'sprint review loaded': (r) => r.status === 200 || r.status === 404,
    });

    requestCount.add(1);

    sleep(randomFloat(10, 30));
  }

  const incrementRes = http.get(`${config.baseUrl}/api/v1/increments/increment-${teamNum}-1`, {
    headers,
    jar,
    tags: { operation: 'getIncrement' },
  });

  check(incrementRes, {
    'increment loaded': (r) => r.status === 200 || r.status === 404,
  });

  requestCount.add(1);

  sleep(randomFloat(10, 30));

  if (sprintId) {
    const burndownRes = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/burndown`, {
      headers,
      jar,
      tags: { operation: 'getBurndown' },
    });

    check(burndownRes, {
      'burndown loaded': (r) => r.status === 200,
      'burndown response time OK': (r) => r.timings.duration < 500,
    });

    recordResponseTime('sprint', burndownRes.timings.duration);
    responseTime.add(burndownRes.timings.duration);
    requestCount.add(1);
  }

  sleep(randomFloat(10, 30));

  const velocityRes = http.get(`${config.baseUrl}/api/v1/reports/velocity/${teamId}`, {
    headers,
    jar,
    tags: { operation: 'getVelocity' },
  });

  check(velocityRes, {
    'velocity report loaded': (r) => r.status === 200,
    'velocity response time OK': (r) => r.timings.duration < 700,
  });

  recordResponseTime('report', velocityRes.timings.duration);
  responseTime.add(velocityRes.timings.duration);
  requestCount.add(1);

  sleep(randomFloat(5, 15));

  if (!isStakeholder && Math.random() < 0.3) {
    const feedbackRes = http.post(
      `${config.baseUrl}/api/v1/sprint-reviews/review-${teamNum}-1/feedback`,
      JSON.stringify({
        content: `Feedback from user ${userNum} during sprint review`,
        type: 'POSITIVE',
      }),
      { headers, jar, tags: { operation: 'addFeedback' } }
    );

    check(feedbackRes, {
      'feedback added': (r) => r.status === 201 || r.status === 200 || r.status === 404,
    });

    requestCount.add(1);
  }

  sleep(randomFloat(5, 15));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;

  return {
    stdout: `
========================================
Sprint Review Peak Test Summary
========================================
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Request Rate: ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(2)} req/s

Response Times:
  - P50: ${(data.metrics.http_req_duration?.values?.['p(50)'] || 0).toFixed(2)}ms
  - P90: ${(data.metrics.http_req_duration?.values?.['p(90)'] || 0).toFixed(2)}ms
  - P95: ${p95.toFixed(2)}ms
  - P99: ${(data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(2)}ms

Error Rate: ${errorRateValue.toFixed(2)}%

Thresholds:
  - P95 < 500ms: ${p95 < 500 ? 'PASS' : 'FAIL'}
  - Error Rate < 1%: ${errorRateValue < 1 ? 'PASS' : 'FAIL'}

Overall Status: ${p95 < 500 && errorRateValue < 1 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/sprint-review-peak-summary.json': JSON.stringify(data, null, 2),
  };
}
