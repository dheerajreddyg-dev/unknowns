# Accessibility Scanning Workflow: Enterprise-Grade Implementation

## Overview

This document outlines a comprehensive accessibility scanning workflow modeled after enterprise-grade tools like Deque's Axe Monitor. The implementation leverages axe-core as the foundational testing engine to provide automated WCAG compliance checking across entire websites.

**Important Note**: This repository is an internal, axe-core-based example inspired by how enterprise accessibility tools operate. It is not an official Deque product and is intended for educational and internal use.

## End-to-End Scan Flow

### 1. Page Discovery

The scanner accepts configuration inputs to determine which pages to scan:

**Input Parameters:**
- `baseUrl`: The primary domain/URL to start scanning
- `sitemapUrl` (optional): Direct URL to sitemap.xml for comprehensive page discovery
- `includePatterns[]`: Regex patterns for URLs to include in scanning
- `excludePatterns[]`: Regex patterns for URLs to exclude from scanning
- `maxDepth`: Maximum crawl depth for BFS discovery (default: 3)
- `maxPages`: Maximum number of pages to scan (default: 100)

**Discovery Methods:**

1. **Sitemap-Based Discovery** (Preferred)
   - Parse sitemap.xml and sitemap index files
   - Extract all valid URLs within the same origin
   - Filter URLs based on include/exclude patterns
   - Respect maxPages limit with priority ordering

2. **Breadth-First Search (BFS) Crawl** (Fallback)
   - Start from baseUrl and discover internal links
   - Follow same-origin links only
   - Apply include/exclude pattern filtering
   - Respect maxDepth and maxPages constraints
   - Normalize URLs (strip fragments, tracking parameters)

### 2. Page Loading

Each discovered page is loaded using a headless browser environment:

**Browser Configuration:**
- **Engine**: Playwright with Chromium
- **Viewport**: 1920x1080 (desktop simulation)
- **User Agent**: Standard desktop Chrome user agent
- **JavaScript**: Enabled (essential for SPA rendering)

**Loading Process:**
- Navigate to each URL with configurable timeout (default: 30s)
- Wait for `networkidle` state to ensure dynamic content loads
- Handle authentication if configured (basic auth, cookie injection)
- Implement request interception to block heavy third-party domains
- Retry navigation up to 2 times on timeout/failure
- Respect polite delays between requests (default: 1s)

### 3. Axe-Core Execution

Automated accessibility testing is performed using axe-core:

**Injection & Setup:**
- Inject `axe.min.js` via `page.addScriptTag()`
- Configure axe with specified rule tag sets
- Set appropriate testing context (full document)

**Execution Configuration:**
```javascript
await axe.run(document, {
  runOnly: {
    type: 'tag',
    values: axeTags // Configurable per site
  },
  resultTypes: ['violations', 'passes', 'incomplete']
});
```

**Data Collection:**
- Extract violations with complete node information
- Capture HTML snippets (sanitized and truncated to ~256 chars)
- Record CSS selectors and failure summaries
- Preserve axe-core metadata (rule descriptions, help URLs)

### 4. Classification & Aggregation

Results are systematically classified and aggregated:

**Per-Page Processing:**
- Group violations by rule ID
- Count issues by impact level (critical, serious, moderate, minor)
- Preserve node-level details with target selectors
- Calculate page-level accessibility scores

**Site-Wide Aggregation:**
- Combine results across all scanned pages
- Generate totals by impact level and rule type
- Track successful vs. failed page scans
- Compute overall site accessibility metrics

### 5. Reporting

Multiple report formats are generated for different stakeholder needs:

**Report Types:**
- `summary.json`: High-level metrics and totals
- `full.json`: Complete detailed results
- `full.csv`: Spreadsheet-compatible format
- `critical.json/.csv`: Critical issues only
- `serious.json/.csv`: Serious issues only

**Report Structure:**
- Timestamped outputs with ISO format
- Organized by site ID and scan timestamp
- Includes scan metadata and configuration
- Provides actionable issue details with remediation links

## Standards & Rule Tag Sets

The scanner applies comprehensive accessibility standards through configurable rule tag sets:

### WCAG Standards
- **`wcag2a`**: WCAG 2.0/2.1 Level A requirements
- **`wcag2aa`**: WCAG 2.0/2.1 Level AA requirements  
- **`wcag21a`**: WCAG 2.1 Level A specific requirements
- **`wcag21aa`**: WCAG 2.1 Level AA specific requirements
- **`wcag22aa`**: WCAG 2.2 Level AA requirements (where supported)

### Regulatory Standards
- **`section508`**: U.S. Section 508 compliance (as mapped by axe-core)
- **`en301549`**: EN 301 549 European standard (via axe-core mapping)

### Additional Rule Sets
- **`best-practice`**: Non-WCAG recommendations for improved accessibility
- **`experimental`**: Emerging accessibility patterns and techniques

### Configurable Rule Tag Sets

Sites can customize which standards to apply:

```json
{
  "standardSite": ["wcag2a", "wcag2aa", "wcag21aa"],
  "governmentSite": ["wcag2a", "wcag2aa", "wcag21aa", "section508"],
  "comprehensiveScan": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]
}
```

## Issue Categories & Result Taxonomy

### Impact Levels (Aligned with Axe-Core)

**Critical**
- Complete barriers to access for users with disabilities
- Examples: Missing alt text, unlabeled form controls, insufficient color contrast
- Requires immediate remediation

**Serious** 
- Significant barriers that substantially impact user experience
- Examples: Missing landmarks, improper heading structure, keyboard traps
- High priority for remediation

**Moderate**
- Barriers that may cause difficulty but don't completely prevent access
- Examples: Missing skip links, non-descriptive link text
- Should be addressed in regular development cycles

**Minor**
- Issues that could improve accessibility but don't create major barriers
- Examples: Missing language declarations, non-optimal ARIA usage
- Can be addressed during routine maintenance

### Result Types

**Automated Issues**
- Definitively identified accessibility violations
- Direct output from axe-core rule evaluation
- Can be fixed with specific remediation steps

**Needs Review**
- Potential issues requiring human judgment
- Complex scenarios that automated tools cannot fully evaluate
- Examples: Color contrast over complex backgrounds, context-dependent content

**Best Practices**
- Non-WCAG recommendations for improved accessibility
- Emerging patterns and techniques
- Defensive accessibility implementations

### Result Structure

Each issue includes comprehensive metadata:

```json
{
  "ruleId": "color-contrast",
  "impact": "serious",
  "description": "Elements must have sufficient color contrast",
  "help": "Ensure sufficient contrast ratios",
  "helpUrl": "https://dequeuniversity.com/rules/axe/4.8/color-contrast",
  "tags": ["cat.color", "wcag2aa", "wcag143"],
  "nodes": [{
    "target": ["body > main > .hero-text"],
    "html": "<p class=\"hero-text text-gray-400\">...",
    "failureSummary": "Element has insufficient color contrast of 2.8:1",
    "cssSelector": "body > main > p.hero-text",
    "xpath": "/html/body/main/p[1]"
  }]
}
```

## Comprehensive Accessibility Checks

### Structure & Semantics
- **Page Title**: Unique, descriptive page titles (`document-title`)
- **Language**: Proper `lang` attribute usage (`html-has-lang`, `html-lang-valid`)
- **Headings**: Logical heading structure and hierarchy (`heading-order`)
- **Landmarks**: Proper use of semantic landmarks (`landmark-*`, `region`)
- **Lists**: Correct list markup and nesting (`list`, `listitem`)
- **Tables**: Appropriate headers and scope attributes (`table-*`)
- **IFrames**: Descriptive frame titles (`frame-title`)
- **Valid Markup**: Proper HTML structure and syntax (`duplicate-id`)

### Links & Navigation
- **Link Text**: Descriptive and contextual link text (`link-name`)
- **Duplicate Links**: Avoid identical link text for different destinations (`identical-links-same-purpose`)
- **Keyboard Navigation**: Accessible focus management (`focus-order-semantics`)
- **Skip Links**: Navigation shortcuts for keyboard users (`skip-link`)

### Images & Media
- **Alternative Text**: Comprehensive alt text for informative images (`image-alt`)
- **Decorative Images**: Proper marking of decorative images (`image-redundant-alt`)
- **Complex Images**: Alternative formats for charts/graphs (`image-alt`)
- **Media Controls**: Accessible video/audio controls (`audio-caption`, `video-caption`)

### Forms & Controls
- **Form Labels**: Clear programmatic labels (`label`, `label-title-only`)
- **Required Fields**: Proper indication of required inputs (`required-attr`)
- **Error Identification**: Clear error messages and associations (`aria-describedby`)
- **Fieldsets**: Logical grouping of related form controls (`fieldset`)
- **Input Purpose**: Autocomplete attributes for user data (`autocomplete-valid`)

### ARIA Implementation
- **Role Validation**: Correct ARIA role usage (`aria-allowed-role`)
- **State Management**: Proper ARIA states and properties (`aria-valid-attr`)
- **Required Attributes**: Complete ARIA attribute sets (`aria-required-attr`)
- **Value Validation**: Correct ARIA attribute values (`aria-valid-attr-value`)
- **Live Regions**: Dynamic content announcements (`aria-live-region`)

### Color & Contrast
- **Text Contrast**: WCAG AA/AAA contrast ratios (`color-contrast`)
- **Non-Text Contrast**: UI component contrast requirements (`color-contrast-enhanced`)
- **Color Dependence**: Information not conveyed by color alone (`color-contrast`)

### Keyboard Accessibility
- **Focus Indicators**: Visible focus indicators (`focus-order-semantics`)
- **Keyboard Traps**: Prevention of focus traps (`no-focus-trap`)
- **Tab Order**: Logical keyboard navigation sequence (`tabindex`)

### Best Practices
- **Performance**: Accessibility-related performance optimizations
- **Progressive Enhancement**: Graceful degradation patterns
- **User Experience**: Additional UX improvements for assistive technology users

## Scanner Limitations & Manual Testing Requirements

### Automated Testing Limitations

**Context-Dependent Content**
- Cannot evaluate appropriateness of alt text content
- Unable to assess logical reading order in complex layouts
- Cannot determine if error messages are sufficiently descriptive

**Dynamic Interactions**
- Limited testing of complex JavaScript interactions
- Cannot fully evaluate keyboard trap scenarios
- May miss issues in single-page application route changes

**Cognitive Accessibility**
- Cannot assess content complexity or readability
- Unable to evaluate user interface predictability
- Cannot measure cognitive load or user comprehension

**Complex Visual Elements**
- Color contrast over images/gradients requires manual verification
- Cannot evaluate video/audio content quality
- May flag decorative elements incorrectly

### Required Manual Testing

**Keyboard Navigation Testing**
- Complete keyboard-only navigation walkthrough
- Tab order verification in complex interfaces
- Focus management in modal dialogs and dynamic content

**Screen Reader Testing**
- NVDA, JAWS, and VoiceOver compatibility verification
- Content reading order and comprehension
- Form completion and error recovery workflows

**Cognitive Accessibility Review**
- Content structure and language complexity assessment
- User interface predictability and consistency evaluation
- Error prevention and recovery mechanism review

**Design Review**
- Visual design accessibility assessment
- Color usage beyond automated contrast checking
- Information hierarchy and visual grouping evaluation

### Combining Automated and Manual Testing

**Recommended Workflow:**
1. **Automated Scanning**: Use this tool for baseline compliance checking
2. **Manual Verification**: Validate automated findings and test uncovered areas
3. **User Testing**: Include users with disabilities in testing processes
4. **Design Reviews**: Integrate accessibility into design system reviews

**Quality Assurance Integration:**
- Include accessibility scanning in CI/CD pipelines
- Establish accessibility acceptance criteria for new features
- Create regular accessibility audit schedules
- Train development teams on manual testing techniques

## Implementation Architecture

### Technology Stack
- **Runtime**: Node.js 20+ with TypeScript
- **Browser Automation**: Playwright (Chromium)
- **Accessibility Engine**: axe-core (latest stable)
- **Configuration**: JSON-based site configuration
- **Reporting**: JSON and CSV output formats

### Scalability Considerations
- **Concurrent Scanning**: Configurable concurrency limits
- **Rate Limiting**: Polite delays to avoid overwhelming target sites
- **Memory Management**: Efficient browser context management
- **Error Recovery**: Robust retry mechanisms and graceful degradation

### Security & Privacy
- **Local Execution**: All scanning performed locally, no external data transmission
- **Authentication Support**: Configurable auth for protected sites
- **Content Filtering**: Request interception for performance and privacy
- **Data Sanitization**: Secure handling of HTML snippets and user data

This documentation provides a foundation for implementing enterprise-grade accessibility scanning that delivers actionable insights while respecting the limitations of automated testing tools.