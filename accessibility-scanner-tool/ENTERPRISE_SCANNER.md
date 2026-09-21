# Enterprise Accessibility Scanner Usage Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run install:playwright
```

### 2. Configure Sites

Edit `config/sites.json` to add your websites:

```json
{
  "sites": [
    {
      "siteId": "my-website",
      "name": "My Website",
      "baseUrl": "https://my-website.com",
      "sitemapUrl": "https://my-website.com/sitemap.xml",
      "includePatterns": [".*"],
      "excludePatterns": [".*\\/admin\\/.*"],
      "maxDepth": 3,
      "maxPages": 50,
      "axeTags": ["wcag2a", "wcag2aa", "wcag21aa"]
    }
  ]
}
```

### 3. Run Scans

```bash
# Scan a specific site
npm run scan -- scan --site my-website

# Scan all configured sites
npm run scan -- scan --all

# Use custom config file
npm run scan -- scan --site my-website --config custom-config.json
```

## Configuration Options

### Site Configuration

| Field | Type | Description |
|-------|------|-------------|
| `siteId` | string | Unique identifier for the site |
| `name` | string | Human-readable site name |
| `baseUrl` | string | Starting URL for scanning |
| `sitemapUrl` | string (optional) | Direct URL to sitemap.xml |
| `includePatterns` | string[] | Regex patterns for URLs to include |
| `excludePatterns` | string[] | Regex patterns for URLs to exclude |
| `maxDepth` | number | Maximum crawl depth (default: 3) |
| `maxPages` | number | Maximum pages to scan (default: 50) |
| `axeTags` | string[] | Accessibility rule tags to apply |
| `politeDelayMs` | number | Delay between requests (default: 1000ms) |
| `concurrency` | number | Concurrent page scans (default: 2) |
| `pageTimeoutMs` | number | Page load timeout (default: 30000ms) |

### WCAG Rule Tags

Available `axeTags` options:

- `wcag2a` - WCAG 2.0/2.1 Level A
- `wcag2aa` - WCAG 2.0/2.1 Level AA  
- `wcag21a` - WCAG 2.1 Level A specific
- `wcag21aa` - WCAG 2.1 Level AA specific
- `wcag22aa` - WCAG 2.2 Level AA (where supported)
- `section508` - U.S. Section 508 compliance
- `best-practice` - Additional accessibility recommendations

### Authentication

For protected sites, add authentication configuration:

```json
{
  "auth": {
    "type": "basic",
    "username": "user",
    "password": "pass"
  }
}
```

Or for cookie-based authentication:

```json
{
  "auth": {
    "type": "cookie",
    "cookies": [
      {
        "name": "session",
        "value": "abc123",
        "domain": ".example.com"
      }
    ]
  }
}
```

## Report Outputs

Reports are generated in `reports/<siteId>/<timestamp>/`:

### JSON Reports
- `summary.json` - High-level scan statistics
- `full.json` - Complete detailed results
- `critical.json` - Critical issues only
- `serious.json` - Serious issues only

### CSV Reports
- `full.csv` - All issues in spreadsheet format
- `critical.csv` - Critical issues for immediate action
- `serious.csv` - Serious issues requiring attention

### Report Structure

**Summary JSON:**
```json
{
  "siteId": "example-site",
  "generatedAt": "2026-01-23T10:30:00.000Z",
  "pageCount": 25,
  "successfulPages": 24,
  "failedPages": 1,
  "totals": {
    "critical": 3,
    "serious": 8,
    "moderate": 12,
    "minor": 5
  },
  "scanDuration": 45000
}
```

**Full Results Structure:**
```json
{
  "siteId": "example-site",
  "generatedAt": "2026-01-23T10:30:00.000Z",
  "pages": [
    {
      "url": "https://example.com/page",
      "timestamp": "2026-01-23T10:30:15.000Z",
      "loadTime": 2500,
      "status": "success",
      "issues": [
        {
          "ruleId": "color-contrast",
          "impact": "serious",
          "description": "Elements must have sufficient color contrast",
          "help": "Ensure sufficient contrast ratios",
          "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
          "tags": ["cat.color", "wcag2aa"],
          "nodes": [
            {
              "target": ["body > main > .hero-text"],
              "html": "<p class=\"hero-text\">Welcome to our site</p>",
              "failureSummary": "Element has insufficient color contrast of 2.8:1"
            }
          ]
        }
      ],
      "totalIssues": 1,
      "criticalCount": 0,
      "seriousCount": 1,
      "moderateCount": 0,
      "minorCount": 0
    }
  ]
}
```

## Advanced Usage

### Custom Scan Scripts

Create custom scan configurations for different purposes:

**CI/CD Integration:**
```json
{
  "siteId": "staging-validation",
  "name": "Staging Environment Validation",
  "baseUrl": "https://staging.example.com",
  "maxPages": 20,
  "axeTags": ["wcag2aa"],
  "concurrency": 1,
  "politeDelayMs": 2000
}
```

**Comprehensive Audit:**
```json
{
  "siteId": "full-audit",
  "name": "Complete Accessibility Audit",
  "baseUrl": "https://example.com",
  "maxPages": 200,
  "axeTags": ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"],
  "maxDepth": 5
}
```

### Performance Optimization

**High-Volume Sites:**
```json
{
  "concurrency": 5,
  "politeDelayMs": 500,
  "pageTimeoutMs": 20000,
  "maxPages": 500
}
```

**Respectful Scanning:**
```json
{
  "concurrency": 1,
  "politeDelayMs": 3000,
  "pageTimeoutMs": 45000
}
```

## Troubleshooting

### Common Issues

**Scan Timeouts:**
- Increase `pageTimeoutMs` for slow sites
- Reduce `concurrency` to lower load
- Check network connectivity

**Authentication Failures:**
- Verify credentials in config
- Test login manually in browser
- Consider cookie-based auth for complex flows

**Memory Issues:**
- Reduce `maxPages` and `concurrency`
- Scan in smaller batches
- Increase Node.js heap size: `--max-old-space-size=4096`

**CORS/Security Blocks:**
- Some sites block headless browsers
- Try adding user agent headers
- Consider authenticated scanning

### Debug Mode

Run with debug output:
```bash
DEBUG=* npm run scan -- scan --site my-website
```

### Selective Scanning

Focus on specific page types:
```json
{
  "includePatterns": [
    ".*\\/blog\\/.*",
    ".*\\/products\\/.*",
    ".*\\/checkout\\/.*"
  ]
}
```

Exclude problem areas:
```json
{
  "excludePatterns": [
    ".*\\/api\\/.*",
    ".*\\/admin\\/.*",
    ".*\\/test\\/.*"
  ]
}
```

## Integration Examples

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Accessibility Scan
on: 
  push:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run install:playwright
      - run: npm run scan -- scan --site production
      - uses: actions/upload-artifact@v4
        with:
          name: accessibility-reports
          path: reports/
```

### Automated Monitoring

Schedule regular scans:
```bash
# Daily production scan at 2 AM
0 2 * * * cd /path/to/scanner && npm run scan -- scan --site production

# Weekly comprehensive audit
0 2 * * 0 cd /path/to/scanner && npm run scan -- scan --all
```

## Best Practices

### Site Configuration
- Start with smaller `maxPages` values and increase gradually
- Use specific `includePatterns` to focus on important pages
- Set appropriate `politeDelayMs` to respect server resources
- Test authentication configuration manually first

### Monitoring Strategy
- Run regular scans (daily/weekly) for trend analysis
- Focus on critical user journeys and high-traffic pages
- Set up alerts for increases in critical/serious issues
- Combine automated scanning with manual testing

### Report Analysis
- Prioritize critical and serious issues for immediate action
- Use CSV exports for tracking progress over time
- Share reports with development teams for remediation
- Include accessibility review in code review processes

This scanner provides a foundation for enterprise-grade accessibility testing while respecting the limitations of automated tools and the need for comprehensive manual testing.