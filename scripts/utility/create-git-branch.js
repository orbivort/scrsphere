#!/usr/bin/env node

/**
 * Branch Creation Script with Validation
 *
 * Creates a new git branch with name validation.
 *
 * Usage:
 *   node create-git-branch.js <type>/<description>
 *   node create-git-branch.js feat user-dashboard
 *
 * Examples:
 *   node create-git-branch.js feat/user-dashboard
 *   node create-git-branch.js feat user-dashboard
 */

import { execSync } from 'child_process';
import { validateBranchName, VALID_TYPES } from './validate-git-branch.js';

function printUsage() {
  console.log(`
Branch Creation with Validation

Usage:
  node create-git-branch.js <type>/<description>
  node create-git-branch.js <type> <description>

Valid types:
  ${VALID_TYPES.join(', ')}

Examples:
  node create-git-branch.js feat/user-dashboard
  node create-git-branch.js feat user-dashboard
  node create-git-branch.js fix/login-validation
  node create-git-branch.js chore/update-dependencies
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  // Build branch name from arguments
  let branchName;

  if (args.length === 1) {
    // Single argument: feat/description
    branchName = args[0];
  } else {
    // Two arguments: feat description
    const [type, ...descriptionParts] = args;
    const description = descriptionParts
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    branchName = `${type}/${description}`;
  }

  // Validate the branch name
  const result = validateBranchName(branchName);

  if (!result.valid) {
    console.error(`❌ ${result.error}`);
    process.exit(1);
  }

  // Check if branch already exists
  try {
    const existingBranches = execSync('git branch --list', {
      encoding: 'utf-8',
    }).trim();

    if (existingBranches.includes(branchName)) {
      console.error(`❌ Branch "${branchName}" already exists`);
      process.exit(1);
    }
  } catch {
    // Ignore errors
  }

  // Create the branch
  try {
    execSync(`git checkout -b ${branchName}`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Created and switched to branch "${branchName}"`);
    console.log(`   Type: ${result.type}`);
    console.log(`   Description: ${result.description}`);
  } catch (error) {
    console.error(`❌ Failed to create branch: ${error.message}`);
    process.exit(1);
  }
}

main();
