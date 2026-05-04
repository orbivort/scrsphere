import { Trend, Rate, Counter, Gauge } from 'k6/metrics';

export const authResponseTime = new Trend('auth_response_time', true);
export const sprintResponseTime = new Trend('sprint_response_time', true);
export const backlogResponseTime = new Trend('backlog_response_time', true);
export const taskResponseTime = new Trend('task_response_time', true);
export const reportResponseTime = new Trend('report_response_time', true);
export const dailyUpdateResponseTime = new Trend('daily_update_response_time', true);

export const authErrorRate = new Rate('auth_errors');
export const apiErrorRate = new Rate('api_errors');
export const dbErrorRate = new Rate('db_errors');

export const loginCount = new Counter('logins');
export const logoutCount = new Counter('logouts');
export const taskUpdateCount = new Counter('task_updates');
export const pbiCreateCount = new Counter('pbi_creates');
export const sprintStartCount = new Counter('sprint_starts');
export const dailyUpdateCount = new Counter('daily_updates');

export const activeUsers = new Gauge('active_users');
export const dbConnections = new Gauge('db_connections');

export function recordResponseTime(category, duration) {
  switch (category) {
    case 'auth':
      authResponseTime.add(duration);
      break;
    case 'sprint':
      sprintResponseTime.add(duration);
      break;
    case 'backlog':
      backlogResponseTime.add(duration);
      break;
    case 'task':
      taskResponseTime.add(duration);
      break;
    case 'report':
      reportResponseTime.add(duration);
      break;
    case 'dailyUpdate':
      dailyUpdateResponseTime.add(duration);
      break;
    default:
      break;
  }
}

export function recordError(category, isError) {
  const value = isError ? 1 : 0;
  switch (category) {
    case 'auth':
      authErrorRate.add(value);
      break;
    case 'api':
      apiErrorRate.add(value);
      break;
    case 'db':
      dbErrorRate.add(value);
      break;
    default:
      apiErrorRate.add(value);
      break;
  }
}

export function recordOperation(operation) {
  switch (operation) {
    case 'login':
      loginCount.add(1);
      break;
    case 'logout':
      logoutCount.add(1);
      break;
    case 'taskUpdate':
      taskUpdateCount.add(1);
      break;
    case 'pbiCreate':
      pbiCreateCount.add(1);
      break;
    case 'sprintStart':
      sprintStartCount.add(1);
      break;
    case 'dailyUpdate':
      dailyUpdateCount.add(1);
      break;
    default:
      break;
  }
}

export function createScenarioMetrics(scenarioName) {
  return {
    responseTime: new Trend(`${scenarioName}_response_time`, true),
    errorRate: new Rate(`${scenarioName}_errors`),
    requestCount: new Counter(`${scenarioName}_requests`),
    successRate: new Rate(`${scenarioName}_success`),
  };
}
