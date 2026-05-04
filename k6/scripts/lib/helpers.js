import http from 'k6/http';
import { check, sleep } from 'k6';
import { config } from './config.js';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function getCsrfToken() {
  const jar = http.cookieJar();

  const csrfRes = http.get(`${config.baseUrl}/api/v1/auth/csrf-token`, { jar });

  if (csrfRes.status !== 200) {
    console.error(`CSRF token request failed with status: ${csrfRes.status}`);
    return { signedToken: null, jar };
  }

  const body = csrfRes.json();
  const signedToken = body?.data?.token;

  if (!signedToken) {
    console.error('CSRF token not found in response body');
    return { signedToken: null, jar };
  }

  return { signedToken, jar };
}

export function authenticate(email, password) {
  const { signedToken, jar } = getCsrfToken();
  if (!signedToken) {
    return { token: null, csrfToken: null, csrfCookie: null };
  }

  const headers = {
    'Content-Type': 'application/json',
    [CSRF_HEADER_NAME]: signedToken,
  };

  const loginRes = http.post(
    `${config.baseUrl}/api/v1/auth/login`,
    JSON.stringify({
      email: email || config.testCredentials.email,
      password: password || config.testCredentials.password,
    }),
    { headers, jar }
  );

  if (loginRes.status !== 200) {
    const errorBody = loginRes.json();
    console.error(
      `Login failed for ${email}: status=${loginRes.status}, error=${JSON.stringify(errorBody)}`
    );
  }

  // Backend uses httpOnly cookies for authentication
  // The accessToken cookie is automatically managed by the cookie jar
  // We just need to check if login was successful
  const success = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login response has user': (r) => {
      if (r.status !== 200) return false;
      const body = r.json();
      return body && body.data && body.data.user;
    },
  });

  if (success && loginRes.status === 200) {
    // Return the jar which contains the httpOnly cookies
    // The token is not in the body - it's in httpOnly cookies
    return {
      token: 'cookie-based', // Indicate cookie-based auth
      csrfToken: signedToken,
      csrfCookie: signedToken,
      jar, // Return the jar for subsequent requests
    };
  }
  return { token: null, csrfToken: signedToken, csrfCookie: signedToken, jar };
}

export function getAuthHeaders(token, csrfToken) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Only add Authorization header if token is not cookie-based
  // Cookie-based auth uses httpOnly cookies sent automatically via cookie jar
  if (token && token !== 'cookie-based') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }

  return headers;
}

export function setupCookieJar(csrfCookie) {
  const jar = http.cookieJar();
  if (csrfCookie) {
    jar.set(config.baseUrl, CSRF_COOKIE_NAME, csrfCookie);
  }
  return jar;
}

export function logout(token, csrfToken, csrfCookie) {
  const headers = getAuthHeaders(token, csrfToken);
  const jar = setupCookieJar(csrfCookie);
  return http.post(`${config.baseUrl}/api/v1/auth/logout`, '{}', { headers, jar });
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

export function thinkTime(type = 'medium') {
  const range = config.thinkTime[type] || config.thinkTime.medium;
  const delay = randomFloat(range.min, range.max);
  sleep(delay);
  return delay;
}

export function makeRequest(method, endpoint, payload, token, csrfToken, csrfCookie, options = {}) {
  const headers = token ? getAuthHeaders(token, csrfToken) : { ...config.headers };
  if (csrfToken && !headers[CSRF_HEADER_NAME]) {
    headers[CSRF_HEADER_NAME] = csrfToken;
  }
  const jar = setupCookieJar(csrfCookie);
  const url = `${config.baseUrl}${endpoint}`;

  const requestOptions = {
    headers,
    jar,
    timeout: options.timeout || config.responseTimeout,
    tags: options.tags || {},
  };

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, requestOptions);
      break;
    case 'POST':
      response = http.post(url, JSON.stringify(payload), requestOptions);
      break;
    case 'PUT':
      response = http.put(url, JSON.stringify(payload), requestOptions);
      break;
    case 'PATCH':
      response = http.patch(url, JSON.stringify(payload), requestOptions);
      break;
    case 'DELETE':
      response = http.del(url, requestOptions);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  return response;
}

export function checkResponse(response, checks, tags = {}) {
  const defaultChecks = {
    'status is 2xx': (r) => r.status >= 200 && r.status < 300,
  };

  const allChecks = { ...defaultChecks, ...checks };
  return check(response, allChecks, tags);
}

export function generateTeamUserId(vu, teams = 10, usersPerTeam = 15) {
  const teamNum = (vu % teams) + 1;
  const userNum = (vu % usersPerTeam) + 1;
  return {
    teamNum,
    userNum,
    email: `team${teamNum}_user${userNum}@loadtest.local`,
  };
}

export function getUserTeams(token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/teams/my-teams`, { headers, jar });

  if (res.status !== 200) {
    console.error(`Failed to get user teams: status=${res.status}`);
    return [];
  }

  const body = res.json();
  return body?.data?.teams || [];
}

export function getActiveSprint(teamId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/sprints/active?teamId=${teamId}`, {
    headers,
    jar,
  });

  if (res.status !== 200) {
    return null;
  }

  const body = res.json();
  return body?.data?.sprint || null;
}

export function getSprintTasks(sprintId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/tasks`, { headers, jar });

  if (res.status !== 200) {
    return [];
  }

  const body = res.json();
  return body?.data?.tasks || [];
}

export function getRandomTask(sprintId, token, csrfToken, jar) {
  const tasks = getSprintTasks(sprintId, token, csrfToken, jar);
  if (!tasks || tasks.length === 0) {
    return null;
  }
  return tasks[Math.floor(Math.random() * tasks.length)];
}

export function getProductBacklog(teamId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/product-backlog?teamId=${teamId}`, {
    headers,
    jar,
  });

  if (res.status !== 200) {
    return [];
  }

  const body = res.json();
  return body?.data?.items || [];
}

export function getTeamVelocity(teamId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/reports/velocity/${teamId}`, { headers, jar });

  if (res.status !== 200) {
    return null;
  }

  const body = res.json();
  return body?.data || null;
}

export function getSprintBurndown(sprintId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/sprints/${sprintId}/burndown`, { headers, jar });

  if (res.status !== 200) {
    return null;
  }

  const body = res.json();
  return body?.data || null;
}

export function getTeamInsights(teamId, token, csrfToken, jar) {
  const headers = getAuthHeaders(token, csrfToken);
  const res = http.get(`${config.baseUrl}/api/v1/reports/insights/${teamId}`, { headers, jar });

  if (res.status !== 200) {
    return null;
  }

  const body = res.json();
  return body?.data || null;
}

export function generatePbiData(teamId, vu, iteration) {
  return {
    teamId,
    title: `PBI from VU${vu}-Iter${iteration}`,
    description: `Generated during load testing by virtual user ${vu}`,
    priority: randomItem(['MUST_HAVE', 'SHOULD_HAVE', 'COULD_HAVE']),
    storyPoints: randomItem([1, 2, 3, 5, 8, 13]),
  };
}

export function generateTaskData(sprintId, pbiId, vu, iteration) {
  return {
    sprintId,
    pbiId,
    title: `Task from VU${vu}-Iter${iteration}`,
    description: `Generated during load testing`,
    estimatedHours: randomItem([2, 4, 8]),
  };
}

export function generateDailyUpdateData(sprintId, vu) {
  const tasks = [
    'Completed code review for feature X',
    'Fixed bug in authentication module',
    'Implemented unit tests for service layer',
    'Updated documentation for API endpoints',
    'Refactored database queries for performance',
    'Added validation to form inputs',
    'Integrated third-party API',
    'Resolved merge conflicts in PR',
  ];

  const impediments = [
    null,
    null,
    null,
    'Waiting for API credentials from DevOps',
    'Need clarification on requirements from PO',
    'Blocked by dependency on Team Alpha',
  ];

  return {
    sprintId,
    yesterdayWork: randomItem(tasks),
    todayWork: randomItem(tasks),
    impediment: randomItem(impediments),
  };
}

export function parseJsonSafely(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

export function extractIdFromResponse(response, path = 'data.id') {
  const data = parseJsonSafely(response);
  if (!data) return null;

  const parts = path.split('.');
  let current = data;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}
