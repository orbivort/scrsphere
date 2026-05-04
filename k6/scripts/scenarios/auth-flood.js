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
} from '../lib/helpers.js';
import { recordResponseTime, recordError, recordOperation } from '../lib/metrics.js';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');
const loginAttempts = new Counter('login_attempts');
const successfulLogins = new Counter('successful_logins');

export const options = {
  scenarios: {
    login_flood: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
};

export default function authFloodTest() {
  const { teamNum, userNum, email } = generateTeamUserId(__VU, 10, 15);

  loginAttempts.add(1);

  const { token, csrfToken, csrfCookie, jar } = authenticate(email, 'LoadTest123!');

  check(token ? { status: 200 } : { status: 401 }, {
    'login successful': (r) => r.status === 200,
  });

  requestCount.add(1);

  if (!token) {
    errorRate.add(1);
    recordError('auth', true);
    return;
  }

  successfulLogins.add(1);
  recordOperation('login');
  recordResponseTime('auth', 0);

  const headers = getAuthHeaders(token, csrfToken);

  const meRes = http.get(`${config.baseUrl}/api/v1/auth/me`, {
    headers,
    jar,
    tags: { operation: 'getCurrentUser' },
  });

  check(meRes, {
    'me successful': (r) => r.status === 200,
  });

  requestCount.add(1);

  sleep(randomFloat(0.5, 2));

  logout(token, csrfToken, csrfCookie);
  recordOperation('logout');

  sleep(randomFloat(0.5, 1));
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errorRateValue = (data.metrics.http_req_failed?.values?.rate || 0) * 100;
  const totalLoginAttempts = data.metrics.login_attempts?.values?.count || 0;
  const totalSuccessfulLogins = data.metrics.successful_logins?.values?.count || 0;
  const loginSuccessRate =
    totalLoginAttempts > 0
      ? ((totalSuccessfulLogins / totalLoginAttempts) * 100).toFixed(2)
      : '0.00';

  return {
    stdout: `
========================================
Authentication Flood Test Summary
========================================
Total Login Attempts: ${totalLoginAttempts}
Successful Logins: ${totalSuccessfulLogins}
Login Success Rate: ${loginSuccessRate}%

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
  - Login Success Rate > 99%: ${parseFloat(loginSuccessRate) > 99 ? 'PASS' : 'FAIL'}

Authentication Performance:
  - Avg login time: ${(data.metrics.auth_response_time?.values?.avg || 0).toFixed(2)}ms
  - Max login time: ${(data.metrics.auth_response_time?.values?.max || 0).toFixed(2)}ms

Overall Status: ${p95 < 500 && errorRateValue < 1 && parseFloat(loginSuccessRate) > 99 ? 'PASS' : 'FAIL'}
========================================
`,
    'k6/results/auth-flood-summary.json': JSON.stringify(data, null, 2),
  };
}
