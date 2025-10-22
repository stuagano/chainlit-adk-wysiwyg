# Security Guide

This document outlines security practices and guidelines for the ADK & Chainlit Agent Builder project.

## Table of Contents

- [Security Auditing](#security-auditing)
- [Dependency Management](#dependency-management)
- [Credentials Management](#credentials-management)
- [Input Validation](#input-validation)
- [Known Vulnerabilities](#known-vulnerabilities)
- [Reporting Security Issues](#reporting-security-issues)

## Security Auditing

### Running Security Audits

We provide automated security audit tools to help identify vulnerabilities:

```bash
# Run comprehensive security audit
npm run security:audit

# Run npm audit only
npm run security:npm

# Automatically fix npm vulnerabilities
npm run security:fix
```

### What the Security Audit Checks

The security audit script (`scripts/security-audit.sh`) performs the following checks:

1. **NPM Vulnerabilities**: Scans dependencies for known security issues
2. **Outdated Dependencies**: Identifies packages that need updates
3. **Sensitive Files**: Searches for credentials files that shouldn't be committed
4. **Gitignore Coverage**: Verifies sensitive patterns are properly excluded
5. **Hardcoded Secrets**: Basic pattern matching for exposed credentials
6. **TypeScript Configuration**: Checks for strict mode and type safety
7. **Security Best Practices**: Validates implementation of security features

### Recommended Schedule

- **Before every commit**: Run `npm run security:audit`
- **Weekly**: Review and update dependencies
- **Monthly**: Full security review including dependency audits

## Dependency Management

### Automated Updates

This project uses **Dependabot** to automatically check for dependency updates:

- Configuration: `.github/dependabot.yml`
- Schedule: Weekly updates for npm packages
- Action: Review and merge Dependabot PRs promptly

### Manual Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update all dependencies (carefully review changes)
npm update

# Update specific package
npm update package-name

# Update to latest major version (breaking changes)
npm install package-name@latest
```

### Security Best Practices

1. **Pin Dependencies**: Use exact versions in `package.json` for production
2. **Review Updates**: Always review CHANGELOG and breaking changes before updating
3. **Test After Updates**: Run full test suite after dependency updates
4. **Audit Regularly**: Run `npm audit` weekly minimum

## Credentials Management

### GCP Service Account Keys

**⚠️ CRITICAL: Never commit service account keys to the repository**

#### Secure Storage

- Store credentials **outside** the repository
- Use environment variables for local development
- Use secret management services in production (e.g., Google Secret Manager, AWS Secrets Manager)

#### Environment Variables

Create a `.env` file (which is gitignored) for local development:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
GEMINI_API_KEY=your_api_key_here
```

#### Generated Code Security

- The code generator **NEVER** includes credentials in generated files
- Users must configure credentials separately (see generated README.md)
- Credentials are validated but not embedded

### API Keys

**Rules for API keys:**

1. ✅ **DO**: Store in environment variables
2. ✅ **DO**: Use `.env` files (gitignored)
3. ✅ **DO**: Rotate keys regularly
4. ❌ **DON'T**: Hardcode in source files
5. ❌ **DON'T**: Commit to version control
6. ❌ **DON'T**: Expose in client-side code

### Files to NEVER Commit

The following files should **never** be committed (verified by security audit):

- `.env` - Environment variables
- `*.pem` - Private key files
- `*.key` - Key files
- `*credentials*.json` - Credential files (especially GCP service account keys)
- `*.p12`, `*.pfx` - Certificate files

All of these patterns are included in `.gitignore`.

## Input Validation

### File Upload Security

The application implements comprehensive file upload validation:

#### GCP Credentials Upload

Located in: `App.tsx` - `handleSAKeyFileChange()`

Validations performed:
1. **File Type**: Must be JSON file
2. **File Size**: Maximum 100KB
3. **JSON Structure**: Must be valid JSON
4. **GCP Format**: Must have `type: "service_account"`
5. **Required Fields**: `project_id`, `private_key_id`, `private_key`, `client_email`

#### File Sync Validation

Located in: `vite.config.ts` - `/api/sync-chainlit` endpoint

Validations performed:
1. **Filename Validation**: Prevents path traversal attacks
2. **Pattern Checks**: Rejects `..`, absolute paths, null bytes
3. **Shell Metacharacter Filtering**: Prevents command injection

Utilities: `utils/validation.ts`

### Path Traversal Prevention

The validation utilities (`utils/validation.ts`) prevent path traversal attacks:

```typescript
// ❌ BLOCKED: Path traversal
"../../../etc/passwd"
"..\\..\\Windows\\System32"

// ❌ BLOCKED: Absolute paths
"/etc/passwd"
"C:\\Windows\\System32"

// ❌ BLOCKED: Null bytes
"file\0.txt"

// ❌ BLOCKED: Shell metacharacters
"file|command.txt"
"file;rm -rf.txt"

// ✅ ALLOWED: Valid filenames
"main.py"
"my_file.txt"
"config-2024.json"
```

## Known Vulnerabilities

### Current Status

Run `npm audit` to see current vulnerability status:

```bash
npm audit
```

### Addressing Vulnerabilities

1. **Automatic Fix**: `npm audit fix`
2. **Manual Review**: For breaking changes, review each vulnerability
3. **Alternative Packages**: Consider switching if a package is unmaintained
4. **Risk Assessment**: Evaluate if the vulnerability applies to your use case

### Recent Security Fixes

This project has addressed the following security issues:

1. **P0-1**: Path traversal vulnerability (CVSS 9.8) - ✅ Fixed
2. **P0-2**: CDN dependency security (CVSS 8.0) - ✅ Fixed
3. **P0-3**: API key exposure (CVSS 8.5) - ✅ Fixed
4. **P0-4**: Credential embedding (CVSS 8.5) - ✅ Fixed
5. **P0-5**: Unhandled promise rejections (CVSS 6.5) - ✅ Fixed
6. **P0-6**: File upload validation (CVSS 7.0) - ✅ Fixed

Details in: `GAP_ANALYSIS.md`

## Security Best Practices

### Code Development

1. **Input Validation**: Always validate user input
2. **Output Encoding**: Escape data before rendering
3. **Type Safety**: Use TypeScript strict mode
4. **Error Handling**: Never expose stack traces to users
5. **Principle of Least Privilege**: Only request necessary permissions

### Testing

1. **Security Tests**: Write tests for security-critical code
2. **Validation Tests**: Test all input validation functions
3. **Negative Tests**: Test with malicious input
4. **Fuzzing**: Consider fuzzing for critical paths

### Deployment

1. **HTTPS Only**: Always use HTTPS in production
2. **Environment Variables**: Use secure secret storage
3. **Access Control**: Implement proper authentication/authorization
4. **Monitoring**: Log security events and monitor for anomalies
5. **Updates**: Keep all dependencies and runtime updated

### Code Review Checklist

When reviewing code, check for:

- [ ] No hardcoded credentials
- [ ] Input validation on all user input
- [ ] Error handling without information disclosure
- [ ] Dependencies are up to date
- [ ] New dependencies are from trusted sources
- [ ] Sensitive operations are properly authorized
- [ ] No new security vulnerabilities introduced

## Reporting Security Issues

### How to Report

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email the maintainers directly with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **24 hours**: Initial acknowledgment
- **7 days**: Assessment and response plan
- **30 days**: Fix or mitigation (for critical issues)

### Responsible Disclosure

We follow responsible disclosure practices:

1. Give maintainers time to fix before public disclosure
2. Work together on timeline for disclosure
3. Credit reporters in security advisories (if desired)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)

## Security Contact

For security-related questions or concerns:
- Review this document first
- Check existing issues (for non-sensitive topics)
- Contact maintainers for sensitive security matters

---

**Last Updated**: 2025-01-21
**Security Audit Tool Version**: 1.0
