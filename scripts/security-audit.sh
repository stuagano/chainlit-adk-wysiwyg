#!/bin/bash

# Security Audit Script for ADK & Chainlit Agent Builder
# Runs comprehensive security checks on the codebase

# Note: Don't use 'set -e' as we want to continue checking even if some checks fail

echo "=========================================="
echo "Security Audit - ADK & Chainlit Agent Builder"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any issues were found
HAS_ISSUES=0

# 1. NPM Audit - Check for known vulnerabilities
echo "📦 Running npm audit..."
echo "------------------------------------------"
if npm audit --audit-level=moderate; then
    echo -e "${GREEN}✓ No npm vulnerabilities found${NC}"
else
    echo -e "${RED}✗ npm vulnerabilities detected${NC}"
    echo "Run 'npm audit fix' to automatically fix issues"
    echo "Run 'npm audit fix --force' for breaking changes (review carefully)"
    HAS_ISSUES=1
fi
echo ""

# 2. Check for outdated dependencies
echo "📊 Checking for outdated dependencies..."
echo "------------------------------------------"
OUTDATED=$(npm outdated || true)
if [ -z "$OUTDATED" ]; then
    echo -e "${GREEN}✓ All dependencies are up to date${NC}"
else
    echo -e "${YELLOW}⚠ Some dependencies are outdated:${NC}"
    npm outdated
    echo "Run 'npm update' to update dependencies (review changes carefully)"
fi
echo ""

# 3. Check for sensitive files
echo "🔍 Checking for sensitive files..."
echo "------------------------------------------"
SENSITIVE_FILES=(
    ".env"
    "*.pem"
    "*.key"
    "*credentials*.json"
    "*.p12"
    "*.pfx"
)

FOUND_SENSITIVE=0
for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
        echo -e "${YELLOW}⚠ Found potentially sensitive files matching: $pattern${NC}"
        find . -name "$pattern" -not -path "./node_modules/*" -not -path "./.git/*"
        FOUND_SENSITIVE=1
    fi
done

if [ $FOUND_SENSITIVE -eq 0 ]; then
    echo -e "${GREEN}✓ No sensitive files found in repository${NC}"
else
    echo -e "${YELLOW}⚠ Sensitive files detected - ensure they are in .gitignore${NC}"
fi
echo ""

# 4. Check .gitignore for sensitive patterns
echo "📝 Verifying .gitignore coverage..."
echo "------------------------------------------"
REQUIRED_GITIGNORE_PATTERNS=(
    ".env"
    "*.pem"
    "*.key"
    "*credentials*.json"
    "gcp-credentials.json"
)

MISSING_PATTERNS=0
for pattern in "${REQUIRED_GITIGNORE_PATTERNS[@]}"; do
    if ! grep -q "$pattern" .gitignore 2>/dev/null; then
        echo -e "${YELLOW}⚠ Missing .gitignore pattern: $pattern${NC}"
        MISSING_PATTERNS=1
    fi
done

if [ $MISSING_PATTERNS -eq 0 ]; then
    echo -e "${GREEN}✓ .gitignore has all recommended patterns${NC}"
fi
echo ""

# 5. Check for hardcoded secrets (basic patterns)
echo "🔐 Scanning for potential hardcoded secrets..."
echo "------------------------------------------"
SECRET_PATTERNS=(
    "password\s*=\s*['\"][^'\"]{8,}"
    "api[_-]?key\s*=\s*['\"][^'\"]{20,}"
    "secret\s*=\s*['\"][^'\"]{20,}"
    "token\s*=\s*['\"][^'\"]{20,}"
    "private[_-]?key\s*=\s*['\"]-----BEGIN"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if git grep -iE "$pattern" -- ':!scripts/security-audit.sh' ':!docs/' ':!*.md' 2>/dev/null | grep -v "test/" | grep -v "mock"; then
        echo -e "${RED}⚠ Potential hardcoded secret found (pattern: $pattern)${NC}"
        FOUND_SECRETS=1
        HAS_ISSUES=1
    fi
done

if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✓ No obvious hardcoded secrets detected${NC}"
fi
echo ""

# 6. Check TypeScript configuration for security
echo "⚙️  Checking TypeScript configuration..."
echo "------------------------------------------"
if [ -f "tsconfig.json" ]; then
    if grep -q '"strict": true' tsconfig.json; then
        echo -e "${GREEN}✓ TypeScript strict mode is enabled${NC}"
    else
        echo -e "${YELLOW}⚠ TypeScript strict mode is not enabled${NC}"
        echo "Consider enabling strict mode for better type safety"
    fi
else
    echo -e "${YELLOW}⚠ No tsconfig.json found${NC}"
fi
echo ""

# 7. Check for security headers in server files
echo "🛡️  Checking for security best practices..."
echo "------------------------------------------"
if [ -f "vite.config.ts" ]; then
    echo -e "${GREEN}✓ Found vite.config.ts${NC}"
    if grep -q "validateFilenames" vite.config.ts; then
        echo -e "${GREEN}✓ Path traversal validation is implemented${NC}"
    else
        echo -e "${YELLOW}⚠ Path traversal validation not found${NC}"
    fi
else
    echo -e "${YELLOW}⚠ No vite.config.ts found${NC}"
fi
echo ""

# 8. Summary
echo "=========================================="
echo "Security Audit Complete"
echo "=========================================="
echo ""

if [ $HAS_ISSUES -eq 1 ]; then
    echo -e "${RED}❌ Security audit found issues that need attention${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the issues reported above"
    echo "2. Run 'npm audit fix' to fix known vulnerabilities"
    echo "3. Ensure sensitive files are in .gitignore"
    echo "4. Remove any hardcoded secrets"
    echo "5. Re-run this script to verify fixes"
    exit 1
else
    echo -e "${GREEN}✅ Security audit passed - no critical issues found${NC}"
    echo ""
    echo "Recommendations:"
    echo "- Run this script regularly (ideally before each commit)"
    echo "- Keep dependencies updated"
    echo "- Review Dependabot PRs promptly"
    echo "- Never commit sensitive credentials"
    exit 0
fi
