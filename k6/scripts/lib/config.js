/**
 * K6 Load Testing Configuration
 *
 * Configuration is loaded from k6/.env.k6 file via dotenv-cli.
 *
 * Environment Variables (configured in k6/.env.k6):
 * - BASE_URL: Target API URL (default: http://localhost:5001 - development)
 * - TEST_USERS: Number of test users to simulate (default: 100)
 * - TEST_TEAMS: Number of test teams to simulate (default: 10)
 * - OUTPUT_FORMAT: Output format for results (default: optimized)
 * - BUCKET_SIZE: Bucket size in seconds for metrics (default: 10)
 * - RESULTS_DIR: Directory to save results (default: k6/results)
 *
 * Usage:
 * - Via npm scripts (loads k6/.env.k6 automatically):
 *   pnpm run loadtest
 *
 * - Override specific variable:
 *   dotenv -e k6/.env.k6 -- k6 run -e BASE_URL=http://custom-url script.js
 */

export const config = {
  baseUrl: __ENV.BASE_URL || 'http://localhost:5002',

  testUsers: parseInt(__ENV.TEST_USERS || '100', 10),
  testTeams: parseInt(__ENV.TEST_TEAMS || '10', 10),

  connectTimeout: '10s',
  responseTimeout: '30s',

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },

  testCredentials: {
    email: 'loadtest@example.com',
    password: 'LoadTest123!',
  },

  thinkTime: {
    short: { min: 1, max: 3 },
    medium: { min: 3, max: 8 },
    long: { min: 10, max: 30 },
  },

  output: {
    format: __ENV.OUTPUT_FORMAT || 'optimized',
    bucketSizeSeconds: parseInt(__ENV.BUCKET_SIZE || '10', 10),
    resultsDir: __ENV.RESULTS_DIR || 'k6/results',
  },
};

export const thresholds = {
  production: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
  },
  development: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
  stress: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.02'],
    errors: ['rate<0.02'],
  },
};

export const endpointThresholds = {
  auth: {
    login: { p95: 300, p99: 500 },
    register: { p95: 300, p99: 500 },
    refresh: { p95: 200, p99: 400 },
  },
  sprint: {
    getActive: { p95: 150, p99: 250 },
    getTasks: { p95: 200, p99: 350 },
    start: { p95: 700, p99: 1200 },
    complete: { p95: 700, p99: 1200 },
  },
  backlog: {
    list: { p95: 200, p99: 350 },
    create: { p95: 200, p99: 400 },
    update: { p95: 150, p99: 300 },
  },
  reports: {
    velocity: { p95: 400, p99: 700 },
    insights: { p95: 500, p99: 900 },
    burndown: { p95: 300, p99: 500 },
  },
  dailyUpdates: {
    create: { p95: 150, p99: 250 },
    list: { p95: 200, p99: 350 },
  },
};
