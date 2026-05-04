#!/usr/bin/env node
/**
 * K6 Load Test Prerequisite Validator
 *
 * Validates all prerequisites before running k6 load tests:
 * 1. k6 is installed
 * 2. Test environment is running (backend on port 5002)
 * 3. Test users exist in database
 * 4. .env.k6 configuration file exists
 */

import { execSync, spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5002',
  healthPath: '/health',
  csrfTokenPath: '/api/v1/auth/csrf-token',
  loginPath: '/api/v1/auth/login',
  testUser: {
    email: 'team1_user1@loadtest.local',
    password: 'LoadTest123!',
  },
  envFile: 'k6/.env.k6',
  k6Script: 'k6/scripts/scenarios/normal-load.js',
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message, status = 'info') {
  const statusColors = {
    info: 'cyan',
    success: 'green',
    error: 'red',
    warning: 'yellow',
  };
  const statusSymbols = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warning: '⚠',
  };
  const symbol = statusSymbols[status];
  const color = statusColors[status];
  log(`  ${symbol} ${step}: ${message}`, color);
}

function checkK6Installed() {
  try {
    const version = execSync('k6 version', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const versionMatch = version.match(/k6(?:\.exe)?\s+v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?)/i);
    const versionNumber = versionMatch ? versionMatch[1] : 'installed';
    logStep('k6 Installation', `k6 v${versionNumber} is installed`, 'success');
    return true;
  } catch {
    logStep('k6 Installation', 'k6 is not installed', 'error');
    log('\n  Install k6:', 'yellow');
    log('    Windows: choco or winget install k6', 'yellow');
    log('    macOS:   brew install k6', 'yellow');
    log('    Linux:   See https://k6.io/docs/get-started/installation/', 'yellow');
    return false;
  }
}

function checkEnvFile() {
  const envPath = path.resolve(process.cwd(), CONFIG.envFile);

  if (fs.existsSync(envPath)) {
    logStep('Configuration File', `${CONFIG.envFile} exists`, 'success');

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('BASE_URL=')) {
        const baseUrl = trimmed.substring('BASE_URL='.length);
        logStep('  BASE_URL', baseUrl, 'info');
        break;
      }
    }
    return true;
  }

  logStep('Configuration File', `${CONFIG.envFile} not found`, 'error');
  log('\n  Create the configuration file:', 'yellow');
  log('    cp k6/.env.k6.example k6/.env.k6', 'yellow');
  return false;
}

function checkBackendRunning() {
  return new Promise((resolve) => {
    const url = new URL(CONFIG.baseUrl);
    let handled = false;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5002,
        path: CONFIG.healthPath,
        method: 'GET',
        timeout: 5000,
      },
      (res) => {
        if (handled) return;
        handled = true;
        if (res.statusCode === 200) {
          logStep('Backend Server', `${CONFIG.baseUrl} is running`, 'success');
          resolve(true);
        } else {
          logStep('Backend Server', `Health check returned ${res.statusCode}`, 'warning');
          resolve(true);
        }
      }
    );

    req.on('error', () => {
      if (handled) return;
      handled = true;
      logStep('Backend Server', `${CONFIG.baseUrl} is not running`, 'error');
      log('\n  Start the test environment:', 'yellow');
      log('    pnpm run dev:test', 'yellow');
      resolve(false);
    });

    req.on('timeout', () => {
      if (handled) return;
      handled = true;
      logStep('Backend Server', 'Connection timeout', 'error');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function checkTestUsers() {
  return new Promise((resolve) => {
    const url = new URL(CONFIG.baseUrl);
    let handled = false;

    const csrfReq = http.request(
      {
        hostname: url.hostname,
        port: url.port || 5002,
        path: CONFIG.csrfTokenPath,
        method: 'GET',
        timeout: 5000,
      },
      (csrfRes) => {
        let csrfBody = '';
        const setCookies = csrfRes.headers['set-cookie'];
        csrfRes.on('data', (chunk) => {
          csrfBody += chunk;
        });
        csrfRes.on('end', () => {
          if (handled) return;
          try {
            const csrfData = JSON.parse(csrfBody);
            const csrfToken = csrfData?.data?.token;

            if (!csrfToken) {
              logStep('Test Users', 'Could not get CSRF token', 'error');
              resolve(false);
              return;
            }

            let csrfCookieStr = '';
            if (setCookies) {
              const csrfCookies = setCookies.filter((c) => c.startsWith('csrfToken='));
              if (csrfCookies.length > 0) {
                const lastCookie = csrfCookies[csrfCookies.length - 1];
                csrfCookieStr = lastCookie.split(';')[0];
              }
            }

            if (!csrfCookieStr) {
              csrfCookieStr = `csrfToken=${csrfToken}`;
            }

            const loginReq = http.request(
              {
                hostname: url.hostname,
                port: url.port || 5002,
                path: CONFIG.loginPath,
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken,
                  Cookie: csrfCookieStr,
                },
                timeout: 10000,
              },
              (loginRes) => {
                if (handled) return;
                let loginBody = '';
                loginRes.on('data', (chunk) => {
                  loginBody += chunk;
                });
                loginRes.on('end', () => {
                  handled = true;
                  if (loginRes.statusCode === 200) {
                    logStep('Test Users', `Test user ${CONFIG.testUser.email} exists`, 'success');
                    resolve(true);
                  } else if (loginRes.statusCode === 401 || loginRes.statusCode === 404) {
                    logStep('Test Users', `Test user ${CONFIG.testUser.email} not found`, 'error');
                    log('\n  Generate test users:', 'yellow');
                    log('    pnpm run loadtest:generate-data', 'yellow');
                    log('    # Or with custom options:', 'yellow');
                    log(
                      '    cd packages/backend && pnpm run loadtest:data -- --teams 5 --users 10',
                      'yellow'
                    );
                    resolve(false);
                  } else if (loginRes.statusCode === 429) {
                    logStep('Test Users', 'Rate limited - backend is under load', 'warning');
                    logStep(
                      '  Note',
                      'Test users likely exist, but rate limiting is active',
                      'info'
                    );
                    resolve(true);
                  } else if (loginRes.statusCode === 403) {
                    logStep('Test Users', 'CSRF validation failed', 'warning');
                    logStep('  Note', 'Test users likely exist, but CSRF validation issue', 'info');
                    resolve(true);
                  } else {
                    logStep('Test Users', `Login returned ${loginRes.statusCode}`, 'warning');
                    resolve(true);
                  }
                });
              }
            );

            loginReq.on('error', () => {
              if (handled) return;
              handled = true;
              logStep('Test Users', 'Failed to verify test users', 'error');
              resolve(false);
            });

            loginReq.on('timeout', () => {
              if (handled) return;
              handled = true;
              logStep('Test Users', 'Login request timeout', 'error');
              loginReq.destroy();
              resolve(false);
            });

            loginReq.write(JSON.stringify(CONFIG.testUser));
            loginReq.end();
          } catch {
            if (handled) return;
            handled = true;
            logStep('Test Users', 'Failed to parse CSRF response', 'error');
            resolve(false);
          }
        });
      }
    );

    csrfReq.on('error', () => {
      if (handled) return;
      handled = true;
      logStep('Test Users', 'Failed to connect to backend', 'error');
      resolve(false);
    });

    csrfReq.on('timeout', () => {
      if (handled) return;
      handled = true;
      logStep('Test Users', 'CSRF request timeout', 'error');
      csrfReq.destroy();
      resolve(false);
    });

    csrfReq.end();
  });
}

async function validatePrerequisites() {
  log('\n========================================', 'blue');
  log('K6 Load Test Prerequisite Validator', 'blue');
  log('========================================\n', 'blue');

  const results = {
    k6: checkK6Installed(),
    envFile: checkEnvFile(),
    backend: false,
    testUsers: false,
  };

  if (!results.k6 || !results.envFile) {
    log('\n========================================', 'red');
    log('Prerequisites FAILED', 'red');
    log('========================================\n', 'red');
    process.exit(1);
  }

  log('\nChecking backend connectivity...', 'cyan');
  results.backend = await checkBackendRunning();

  if (!results.backend) {
    log('\n========================================', 'red');
    log('Prerequisites FAILED', 'red');
    log('========================================\n', 'red');
    process.exit(1);
  }

  log('\nVerifying test users...', 'cyan');
  results.testUsers = await checkTestUsers();

  if (!results.testUsers) {
    log('\n========================================', 'red');
    log('Prerequisites FAILED', 'red');
    log('========================================\n', 'red');
    process.exit(1);
  }

  log('\n========================================', 'green');
  log('All Prerequisites PASSED', 'green');
  log('========================================', 'green');
  log('\nStarting load test...\n', 'cyan');

  return true;
}

function runLoadTest() {
  const args = process.argv.slice(2);
  const k6Script = args.find((arg) => arg.endsWith('.js')) || CONFIG.k6Script;

  const k6Args = ['run', k6Script, ...args.filter((arg) => !arg.endsWith('.js'))];

  log(`Running: k6 ${k6Args.join(' ')}\n`, 'cyan');

  const k6 = spawn('k6', k6Args, {
    stdio: 'inherit',
    env: { ...process.env },
  });

  k6.on('error', (err) => {
    log(`\nFailed to start k6: ${err.message}`, 'red');
    process.exit(1);
  });

  k6.on('close', (code) => {
    process.exit(code || 0);
  });
}

async function main() {
  try {
    await validatePrerequisites();
    runLoadTest();
  } catch (err) {
    log(`\nUnexpected error: ${err.message}`, 'red');
    process.exit(1);
  }
}

main();
