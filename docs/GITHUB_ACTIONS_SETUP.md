# GitHub Actions Workflows

## CI/CD Pipeline (test.yml)

The `test.yml` workflow file was created but could not be automatically committed due to GitHub App permissions restrictions.

### Manual Setup Required

To enable the CI/CD pipeline, you need to manually create `.github/workflows/test.yml` with the following content:

```yaml
name: Test & Build

on:
  push:
    branches: [ main, develop, 'claude/**' ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Generate coverage report
      run: npm run test:coverage
      continue-on-error: true

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      if: always()
      with:
        files: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false

  lint:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run ESLint
      run: npm run lint
      continue-on-error: true

    - name: Run Prettier check
      run: npm run format:check
      continue-on-error: true

  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
        retention-days: 7

  security:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run security audit
      run: npm audit --audit-level=high
      continue-on-error: true
```

### How to Set Up

1. Copy the content above to `.github/workflows/test.yml`
2. Commit and push the file
3. The workflow will automatically run on push and pull requests

### What This Workflow Does

- **Test Job**: Runs unit tests and generates coverage reports
- **Lint Job**: Checks code quality with ESLint and Prettier
- **Build Job**: Builds the application and saves artifacts
- **Security Job**: Runs npm audit for vulnerabilities

### Status Badges

Once the workflow is running, add these badges to your README.md:

```markdown
![Tests](https://github.com/stuagano/chainlit-adk-wysiwyg/workflows/Test%20&%20Build/badge.svg)
![Coverage](https://codecov.io/gh/stuagano/chainlit-adk-wysiwyg/branch/main/graph/badge.svg)
```
