const ALLOWED_PACKAGE_MANAGERS = ['pnpm'];
const PACKAGE_MANAGER_NAME = 'pnpm';

function getPackageManagerFromUserAgent() {
  const userAgent = process.env.npm_config_user_agent;
  if (!userAgent) return null;

  if (userAgent.includes('pnpm')) return 'pnpm';
  if (userAgent.includes('yarn')) return 'yarn';
  if (userAgent.includes('npm')) return 'npm';
  return null;
}

function getPackageManagerFromNpmExecPath() {
  const npmExecPath = process.env.npm_execpath || '';
  if (npmExecPath.includes('pnpm')) return 'pnpm';
  if (npmExecPath.includes('yarn')) return 'yarn';
  if (npmExecPath.includes('npm') || npmExecPath.includes('npx')) return 'npm';
  return null;
}

function isRunningWithAllowedPackageManager() {
  const pm = getPackageManagerFromUserAgent() || getPackageManagerFromNpmExecPath();
  return pm !== null && ALLOWED_PACKAGE_MANAGERS.includes(pm);
}

function main() {
  const currentPm = getPackageManagerFromUserAgent();
  const allowed = isRunningWithAllowedPackageManager();

  if (!allowed) {
    const detected = currentPm || 'npm';
    console.error('');
    console.error(
      '\x1b[31m%s\x1b[0m',
      '╔══════════════════════════════════════════════════════════════╗'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║                    PACKAGE MANAGER WARNING                   ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '╠══════════════════════════════════════════════════════════════╣'
    );
    console.error('\x1b[31m%s\x1b[0m', `║  Detected: ${detected.padEnd(49)}║`);
    console.error('\x1b[31m%s\x1b[0m', `║  Required: ${PACKAGE_MANAGER_NAME.padEnd(49)}║`);
    console.error(
      '\x1b[31m%s\x1b[0m',
      '╠══════════════════════════════════════════════════════════════╣'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║  This project requires pnpm as the package manager.         ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║                                                              ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║  Please use one of the following commands instead:           ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║                                                              ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║    pnpm install          Install dependencies               ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║    pnpm run <script>     Run a script                       ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║    pnpm add <package>    Add a dependency                   ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '║                                                              ║'
    );
    console.error(
      '\x1b[31m%s\x1b[0m',
      '╚══════════════════════════════════════════════════════════════╝'
    );
    console.error('');
    process.exit(1);
  }
}

main();
