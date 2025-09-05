# GitHub Integration Guide

This guide covers integrating the Playwright sample project with GitHub Actions for CI/CD and MCP (Model Context Protocol) agent integration.

## 🚀 GitHub Actions Workflows

### Basic Playwright Testing Workflow

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npm run test
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### Multi-Environment Testing Workflow

Create `.github/workflows/multi-env-tests.yml`:

```yaml
name: Multi-Environment Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM

jobs:
  test:
    timeout-minutes: 60
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]
        test-type: [ui, api, db, performance]
        
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
      
    - name: Set up test environment
      run: |
        cp .env.example .env
        echo "TEST_ENV=ci" >> .env
        echo "BASE_URL=http://localhost:3000" >> .env
        
    - name: Run ${{ matrix.test-type }} tests
      run: npm run test:${{ matrix.test-type }}
      env:
        CI: true
        
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report-${{ matrix.os }}-node${{ matrix.node-version }}-${{ matrix.test-type }}
        path: |
          playwright-report/
          test-results/
        retention-days: 30
```

### Advanced CI/CD Pipeline

Create `.github/workflows/ci-cd-pipeline.yml`:

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
  PLAYWRIGHT_VERSION: '1.40.0'

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - run: npm run lint
    - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - run: npm run test:unit
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  e2e-tests:
    needs: [lint-and-type-check, unit-tests]
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps
    
    - name: Run Playwright tests
      run: npx playwright test --shard=${{ matrix.shard }}
      env:
        CI: true
        
    - name: Upload blob report to GitHub Actions Artifacts
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: blob-report-${{ matrix.shard }}
        path: blob-report
        retention-days: 1

  merge-reports:
    if: always()
    needs: [e2e-tests]
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    - run: npm ci

    - name: Download blob reports from GitHub Actions Artifacts
      uses: actions/download-artifact@v4
      with:
        path: all-blob-reports
        pattern: blob-report-*
        merge-multiple: true

    - name: Merge into HTML Report
      run: npx playwright merge-reports --reporter html ./all-blob-reports

    - name: Upload HTML report
      uses: actions/upload-artifact@v4
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 14

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [e2e-tests]
    runs-on: ubuntu-latest
    environment: staging
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to staging
      run: echo "Deploy to staging environment"
      # Add your deployment steps here

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [e2e-tests]
    runs-on: ubuntu-latest
    environment: production
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to production
      run: echo "Deploy to production environment"
      # Add your deployment steps here
```

### Performance Testing Workflow

Create `.github/workflows/performance-tests.yml`:

```yaml
name: Performance Tests
on:
  schedule:
    - cron: '0 1 * * *'  # Daily at 1 AM
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
        - staging
        - production

jobs:
  performance-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps
    
    - name: Run performance tests
      run: npm run test:performance
      env:
        TEST_ENV: ${{ github.event.inputs.environment || 'staging' }}
        
    - name: Upload performance results
      uses: actions/upload-artifact@v4
      with:
        name: performance-report
        path: |
          playwright-report/
          performance-results/
          
    - name: Comment PR with performance results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          const path = 'performance-results/summary.json';
          if (fs.existsSync(path)) {
            const results = JSON.parse(fs.readFileSync(path, 'utf8'));
            const comment = `## Performance Test Results
            
            | Metric | Value | Threshold | Status |
            |--------|-------|-----------|--------|
            | Load Time | ${results.loadTime}ms | <2000ms | ${results.loadTime < 2000 ? '✅' : '❌'} |
            | FCP | ${results.fcp}ms | <1500ms | ${results.fcp < 1500 ? '✅' : '❌'} |
            | LCP | ${results.lcp}ms | <2500ms | ${results.lcp < 2500 ? '✅' : '❌'} |
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
          }
```

## 🤖 MCP Agent Integration

### Overview

Model Context Protocol (MCP) agents can interact with your Playwright tests to provide intelligent test generation, maintenance, and analysis.

### Setting Up MCP Agent Integration

#### 1. Install MCP Dependencies

Add to your `package.json`:

```json
{
  "devDependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@modelcontextprotocol/server-playwright": "^1.0.0"
  }
}
```

#### 2. Create MCP Configuration

Create `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "playwright-agent": {
      "command": "uvx",
      "args": ["playwright-mcp-server@latest"],
      "env": {
        "PLAYWRIGHT_PROJECT_PATH": ".",
        "FASTMCP_LOG_LEVEL": "INFO"
      },
      "disabled": false,
      "autoApprove": [
        "generate_test",
        "analyze_test_results",
        "suggest_improvements"
      ]
    },
    "test-data-generator": {
      "command": "uvx", 
      "args": ["test-data-mcp-server@latest"],
      "env": {
        "DATA_PATH": "./data",
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": [
        "generate_test_data",
        "validate_test_data"
      ]
    }
  }
}
```

#### 3. GitHub Actions Integration with MCP

Create `.github/workflows/mcp-test-generation.yml`:

```yaml
name: MCP Test Generation
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'src/**'
      - 'pages/**'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Setup MCP environment
      run: |
        pip install uv
        uv tool install playwright-mcp-server
        
    - name: Generate tests with MCP agent
      run: |
        # Use MCP agent to analyze changed files and generate tests
        npx kiro-mcp generate-tests \
          --changed-files="${{ steps.changes.outputs.files }}" \
          --output-dir="tests/generated" \
          --test-type="ui,api"
          
    - name: Run generated tests
      run: |
        npx playwright test tests/generated/ --reporter=json > test-results.json
        
    - name: Analyze test results with MCP
      run: |
        npx kiro-mcp analyze-results \
          --results-file="test-results.json" \
          --output-file="analysis.md"
          
    - name: Comment on PR with analysis
      uses: actions/github-script@v7
      with:
        script: |
          const fs = require('fs');
          if (fs.existsSync('analysis.md')) {
            const analysis = fs.readFileSync('analysis.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🤖 MCP Agent Analysis\n\n${analysis}`
            });
          }
          
    - name: Commit generated tests
      run: |
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add tests/generated/
        git diff --staged --quiet || git commit -m "🤖 Auto-generated tests via MCP agent"
        git push
```

### MCP Agent Capabilities

#### 1. Intelligent Test Generation

```typescript
// Example: MCP agent can generate tests based on page changes
// When you modify LoginPage.ts, the agent generates:

test.describe('Generated: LoginPage Tests', () => {
  test('should handle new validation rules', async ({ loginPage }) => {
    // Auto-generated based on code analysis
    await loginPage.navigate();
    await loginPage.enterInvalidEmail('invalid-email');
    await expect(loginPage.emailValidationError).toBeVisible();
  });
});
```

#### 2. Test Maintenance

```yaml
# .github/workflows/mcp-maintenance.yml
name: MCP Test Maintenance
on:
  schedule:
    - cron: '0 3 * * 1'  # Weekly on Monday

jobs:
  maintain-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Analyze test health
      run: |
        npx kiro-mcp analyze-test-health \
          --test-dir="tests/" \
          --report-file="health-report.json"
          
    - name: Update flaky tests
      run: |
        npx kiro-mcp fix-flaky-tests \
          --health-report="health-report.json" \
          --auto-fix=true
          
    - name: Create maintenance PR
      uses: peter-evans/create-pull-request@v5
      with:
        title: "🤖 Automated test maintenance"
        body: "Automated test improvements generated by MCP agent"
        branch: mcp/test-maintenance
```

#### 3. Performance Analysis

```typescript
// MCP agent can analyze performance trends
// and suggest optimizations

// Generated performance test improvements:
test('optimized login performance', async ({ page, performanceUtils }) => {
  await performanceUtils.startTracing();
  
  await page.goto('/login');
  await page.fill('[data-testid="username"]', 'testuser');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="submit"]');
  
  const metrics = await performanceUtils.stopTracing();
  
  // MCP-suggested performance assertions
  expect(metrics.navigationTiming.loadEventEnd).toBeLessThan(2000);
  expect(metrics.paintTiming.firstContentfulPaint).toBeLessThan(1500);
});
```

### MCP Integration Best Practices

#### 1. Configuration Management

```json
// .kiro/settings/mcp.json - Environment-specific settings
{
  "mcpServers": {
    "playwright-agent": {
      "env": {
        "ENVIRONMENT": "${TEST_ENV}",
        "MAX_GENERATED_TESTS": "10",
        "CONFIDENCE_THRESHOLD": "0.8"
      }
    }
  }
}
```

#### 2. Security Considerations

```yaml
# Secure MCP integration in GitHub Actions
env:
  MCP_API_KEY: ${{ secrets.MCP_API_KEY }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

steps:
- name: Validate MCP permissions
  run: |
    # Ensure MCP agent has limited permissions
    npx kiro-mcp validate-permissions \
      --allowed-operations="generate,analyze" \
      --forbidden-operations="delete,modify-config"
```

#### 3. Quality Gates

```typescript
// Add quality gates for MCP-generated tests
test.describe('MCP Quality Gates', () => {
  test.beforeAll(async () => {
    // Validate generated test quality
    const generatedTests = await glob('tests/generated/**/*.spec.ts');
    
    for (const testFile of generatedTests) {
      const quality = await analyzeTestQuality(testFile);
      expect(quality.score).toBeGreaterThan(0.7);
      expect(quality.coverage).toBeGreaterThan(0.8);
    }
  });
});
```

## 📊 Monitoring and Reporting

### Test Results Dashboard

Create `.github/workflows/test-dashboard.yml`:

```yaml
name: Test Dashboard Update
on:
  workflow_run:
    workflows: ["Playwright Tests"]
    types: [completed]

jobs:
  update-dashboard:
    runs-on: ubuntu-latest
    steps:
    - name: Update test dashboard
      uses: actions/github-script@v7
      with:
        script: |
          // Update GitHub Pages dashboard with test results
          const testResults = await github.rest.actions.listWorkflowRunArtifacts({
            owner: context.repo.owner,
            repo: context.repo.repo,
            run_id: context.payload.workflow_run.id
          });
          
          // Process and display results
          console.log('Test results updated');
```

### Slack Integration

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    channel: '#qa-alerts'
    text: 'Playwright tests failed in ${{ github.repository }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔧 Troubleshooting GitHub Actions

### Common Issues

1. **Browser installation failures:**
   ```yaml
   - name: Install system dependencies
     run: |
       sudo apt-get update
       sudo apt-get install -y libnss3-dev libatk-bridge2.0-dev
   ```

2. **Timeout issues:**
   ```yaml
   - name: Run tests with extended timeout
     run: npx playwright test
     timeout-minutes: 30
   ```

3. **Artifact upload failures:**
   ```yaml
   - name: Upload artifacts with retry
     uses: actions/upload-artifact@v4
     if: always()
     continue-on-error: true
   ```

### Debug GitHub Actions

```yaml
- name: Debug environment
  run: |
    echo "Node version: $(node --version)"
    echo "NPM version: $(npm --version)"
    echo "Playwright version: $(npx playwright --version)"
    echo "Available browsers:"
    npx playwright install --dry-run
```

This comprehensive GitHub integration guide provides everything needed to set up CI/CD pipelines, MCP agent integration, and monitoring for your Playwright project.