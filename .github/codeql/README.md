# CodeQL Configuration

This directory contains configuration files for GitHub CodeQL code scanning.

## Configuration File

### `codeql-config.yml`

The main CodeQL configuration file that customizes the analysis to focus on production code and reduce false positives.

#### What's Excluded

The configuration excludes the following paths from analysis:

1. **Test Files**
   - `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`, `**/*.test.jsx`
   - `**/__tests__/**`, `**/test/**`, `**/tests/**`
   - Test utilities and setup files

2. **E2E Tests**
   - `**/e2e/**`
   - `**/*.e2e.ts`, `**/*.e2e.tsx`
   - `**/*.spec.ts`, `**/*.spec.tsx`

3. **Performance Testing**
   - `k6/**` - K6 load testing scripts

4. **Generated Code**
   - `**/generated/**`
   - `**/*.generated.ts`
   - `**/prisma/index-browser.js`

5. **Configuration Files**
   - Build configurations (`vite.config.ts`, `vitest.config.ts`, etc.)
   - Linting configurations
   - Playwright configuration

6. **Build Scripts**
   - `scripts/**` - Build and utility scripts

7. **Documentation**
   - `docs/**`
   - `**/*.md`

8. **Type Definitions**
   - `**/*.d.ts` - Often contain unused imports for documentation purposes

#### Query Filters

The configuration also disables specific CodeQL queries that are known to produce false positives:

- `js/useless-assignment-to-local` - Often flags legitimate patterns in React hooks
- `js/superfluous-trailing-arguments` - False positives with certain constructor patterns

## Benefits

### 1. **Reduced False Positives**

By excluding test files and generated code, we significantly reduce the number of false positive alerts that developers need to review.

### 2. **Faster Analysis**

Excluding non-production code speeds up the CodeQL analysis, reducing CI/CD pipeline runtime.

### 3. **Focused Security Review**

Security team and developers can focus on actual production code vulnerabilities rather than test code quality issues.

### 4. **Alignment with ESLint**

The exclusions align with the project's ESLint configuration, ensuring consistent code quality tooling behavior.

## Estimated Impact

Based on the CodeQL analysis report (2026-05-07), this configuration would:

- **Reduce total alerts from 75 to approximately 35** (excluding 40 test/development file alerts)
- **Eliminate all Note-level alerts** (44 alerts in test files)
- **Eliminate false positive Warning-level alerts** (3 StorageEvent constructor alerts)
- **Focus on production code security issues**

### Before Configuration

- Total Alerts: 75
- High Severity: 11 (10 false positives, 1 fixed)
- Medium Severity: 3 (all valid but low risk)
- Warning: 17 (15 false positives, 2 fixed)
- Note: 44 (all in test files)

### After Configuration (Estimated)

- Total Alerts: ~35
- High Severity: 1 (fixed)
- Medium Severity: 3 (valid but low risk)
- Warning: 2 (fixed)
- Note: 0 (all excluded)

## Usage

The configuration is automatically used by the GitHub Actions workflow in `.github/workflows/ci.yml`.

### Local Testing

To test CodeQL configuration locally:

```bash
# Initialize CodeQL database
codeql database create --language=typescript --source-root=. --output=codeql-db

# Run analysis with configuration
codeql database analyze codeql-db --config=.github/codeql/codeql-config.yml --format=csv --output=results.csv
```

## Maintenance

### Adding New Exclusions

If you identify additional patterns that should be excluded:

1. Edit `.github/codeql/codeql-config.yml`
2. Add the path pattern to the `paths-ignore` section
3. Document the reason for the exclusion in comments
4. Test the configuration locally or in a PR

### Disabling Specific Queries

To disable additional queries that produce false positives:

1. Identify the query ID from the CodeQL alert URL
2. Add an entry to the `query-filters` section
3. Include a reason for the exclusion
4. Document in this README

### Review Periodically

Review the configuration quarterly to:

- Ensure exclusions are still relevant
- Check if previously excluded paths now contain production code
- Evaluate if disabled queries should be re-enabled
- Update based on new CodeQL capabilities

## References

- [CodeQL Configuration Documentation](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/configuring-code-scanning#using-a-custom-configuration-file)
- [CodeQL Query Suites](https://docs.github.com/en/code-security/codeql-cli/getting-started-with-the-codeql-cli/configuring-the-codeql-cli#query-suites)
- [CodeQL Path Filtering](https://docs.github.com/en/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/configuring-code-scanning#excluding-files-from-analysis)

## Related Files

- `.github/workflows/ci.yml` - CI/CD workflow configuration
- `eslint.config.js` - ESLint configuration with similar exclusions
- `docs/codeql-alerts-analysis-report.md` - Detailed analysis of CodeQL alerts
