import axe from 'axe-core';

// Enhanced WCAG fix recommendations database with more detailed guidance
const wcagRecommendations = {
  'color-contrast': {
    description: 'Ensure sufficient color contrast between foreground and background colors',
    recommendation: 'Use colors that meet WCAG AA contrast ratio of at least 4.5:1 for normal text and 3:1 for large text (18pt+ or 14pt+ bold)',
    priority: 1,
    effort: 'medium',
    suggestedCode: `/* Accessible color combinations */
.text-primary { color: #1f2937; background: #ffffff; } /* Ratio: 12.6:1 */
.text-secondary { color: #374151; background: #f9fafb; } /* Ratio: 9.35:1 */
.text-on-dark { color: #f3f4f6; background: #111827; } /* Ratio: 15.8:1 */

/* Large text (18pt+) can use 3:1 ratio */
h1, h2, .large-text { color: #6b7280; background: #ffffff; } /* Ratio: 4.6:1 */`,
    wcagCriteria: ['1.4.3', '1.4.6', '1.4.11'],
    wcagLevel: 'AA',
    testingTools: ['Color Contrast Checker', 'WAVE', 'axe DevTools'],
    automatedFix: true
  },
  'image-alt': {
    description: 'All images must have alternative text for screen readers',
    recommendation: 'Add descriptive alt attributes that convey the content and purpose of the image',
    priority: 1,
    effort: 'low',
    suggestedCode: `<!-- Informative image -->
<img src="product.jpg" alt="Red running shoes with white laces, size 10">

<!-- Functional image (button/link) -->
<a href="/cart"><img src="cart.svg" alt="View shopping cart (3 items)"></a>

<!-- Decorative image -->
<img src="border-decoration.png" alt="" role="presentation">

<!-- Complex image with long description -->
<figure>
  <img src="chart.png" alt="Q4 2024 sales chart showing 25% growth" 
       aria-describedby="chart-desc">
  <figcaption id="chart-desc">
    Detailed description of the chart data...
  </figcaption>
</figure>`,
    wcagCriteria: ['1.1.1'],
    wcagLevel: 'A',
    testingTools: ['Screen reader', 'axe DevTools'],
    automatedFix: false
  },
  'label': {
    description: 'Form elements must have accessible labels',
    recommendation: 'Associate labels with form controls using for/id attributes or wrap the control with the label element',
    priority: 1,
    effort: 'low',
    suggestedCode: `<!-- Explicit label (recommended) -->
<label for="email">Email Address <span aria-hidden="true">*</span></label>
<input type="email" id="email" name="email" required aria-required="true">

<!-- Implicit label -->
<label>
  Phone Number
  <input type="tel" name="phone">
</label>

<!-- Hidden label for visual designs -->
<label for="search" class="sr-only">Search products</label>
<input type="search" id="search" placeholder="Search...">

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}`,
    wcagCriteria: ['1.3.1', '3.3.2', '4.1.2'],
    wcagLevel: 'A',
    testingTools: ['Screen reader', 'axe DevTools'],
    automatedFix: false
  },
  'button-name': {
    description: 'Buttons must have accessible names that describe their purpose',
    recommendation: 'Ensure buttons have visible text, aria-label, or aria-labelledby to describe their action',
    priority: 1,
    effort: 'low',
    suggestedCode: `<!-- Button with visible text -->
<button type="submit">Submit Application</button>

<!-- Icon button with aria-label -->
<button type="button" aria-label="Close dialog" onclick="closeModal()">
  <svg aria-hidden="true"><!-- close icon --></svg>
</button>

<!-- Icon button with visible tooltip -->
<button type="button" aria-label="Print document" title="Print">
  <span class="icon-print" aria-hidden="true"></span>
</button>

<!-- Button described by another element -->
<h3 id="section-title">User Settings</h3>
<button aria-labelledby="section-title">Edit</button>`,
    wcagCriteria: ['4.1.2'],
    wcagLevel: 'A',
    testingTools: ['Screen reader', 'axe DevTools'],
    automatedFix: false
  },
  'link-name': {
    description: 'Links must have accessible names that describe their destination',
    recommendation: 'Use descriptive link text that makes sense out of context; avoid "click here" or "read more"',
    priority: 1,
    effort: 'low',
    suggestedCode: `<!-- Descriptive link text -->
<a href="/pricing">View pricing plans</a>

<!-- Link with icon -->
<a href="/docs/guide.pdf">
  Download user guide 
  <span aria-hidden="true">(PDF, 2.5MB)</span>
  <span class="sr-only">, opens in new window</span>
</a>

<!-- Image link -->
<a href="/profile" aria-label="View your profile">
  <img src="avatar.jpg" alt="">
</a>

<!-- Avoid these patterns -->
<!-- BAD: <a href="/more">Read more</a> -->
<!-- BAD: <a href="/page">Click here</a> -->

<!-- Better alternatives -->
<a href="/article">Read the full accessibility guide</a>
<p>Learn about accessibility. <a href="/guide">Read our complete WCAG guide</a></p>`,
    wcagCriteria: ['2.4.4', '4.1.2'],
    wcagLevel: 'A',
    testingTools: ['Screen reader', 'WAVE'],
    automatedFix: false
  },
  'document-title': {
    description: 'Every page must have a unique and descriptive title',
    recommendation: 'Add a title element that describes the page content and includes the site name',
    priority: 2,
    effort: 'low',
    suggestedCode: `<!-- Good page title format: Page Name - Section - Site Name -->
<title>Contact Us - Support - Acme Corporation</title>
<title>iPhone 15 Pro - Products - Tech Store</title>
<title>Order #12345 Confirmed - My Account - Shop</title>

<!-- For SPAs, update title on navigation -->
document.title = "Dashboard - Admin Panel";

<!-- React Helmet example -->
<Helmet>
  <title>{pageTitle} - {siteName}</title>
</Helmet>`,
    wcagCriteria: ['2.4.2'],
    wcagLevel: 'A',
    testingTools: ['Browser tab', 'axe DevTools'],
    automatedFix: true
  },
  'html-has-lang': {
    description: 'HTML document must have a valid language attribute',
    recommendation: 'Add the lang attribute to the html element with a valid BCP 47 language code',
    priority: 2,
    effort: 'low',
    suggestedCode: `<!-- Set primary language -->
<html lang="en">

<!-- Common language codes -->
<html lang="en-US">  <!-- US English -->
<html lang="en-GB">  <!-- British English -->
<html lang="es">     <!-- Spanish -->
<html lang="fr">     <!-- French -->
<html lang="de">     <!-- German -->
<html lang="zh-CN">  <!-- Simplified Chinese -->
<html lang="ja">     <!-- Japanese -->

<!-- Multi-language content -->
<html lang="en">
  <body>
    <p>Welcome to our website.</p>
    <p lang="es">Bienvenido a nuestro sitio web.</p>
    <blockquote lang="fr" cite="source.html">
      Bonjour le monde!
    </blockquote>
  </body>
</html>`,
    wcagCriteria: ['3.1.1'],
    wcagLevel: 'A',
    testingTools: ['axe DevTools', 'WAVE'],
    automatedFix: true
  },
  'landmark-one-main': {
    description: 'Page should have exactly one main landmark to identify primary content',
    recommendation: 'Use a single <main> element to wrap the primary content of the page',
    priority: 2,
    effort: 'low',
    suggestedCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Page Title - Site Name</title>
</head>
<body>
  <header role="banner">
    <nav role="navigation" aria-label="Main">
      <!-- Primary navigation -->
    </nav>
  </header>

  <main id="main-content">
    <h1>Page Heading</h1>
    <!-- Primary page content -->
    
    <section aria-labelledby="section1">
      <h2 id="section1">Section Title</h2>
      <!-- Section content -->
    </section>
  </main>

  <aside role="complementary" aria-label="Related content">
    <!-- Sidebar content -->
  </aside>

  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</body>
</html>`,
    wcagCriteria: ['1.3.1', '2.4.1'],
    wcagLevel: 'A',
    testingTools: ['Screen reader', 'Landmark navigation'],
    automatedFix: false
  },
  'heading-order': {
    description: 'Heading levels should increase by one and not skip levels',
    recommendation: 'Use headings in a logical order (h1 -> h2 -> h3) without skipping levels',
    priority: 2,
    effort: 'medium',
    suggestedCode: `<!-- Correct heading hierarchy -->
<h1>Main Page Title</h1>
  <h2>First Section</h2>
    <h3>Subsection A</h3>
    <h3>Subsection B</h3>
  <h2>Second Section</h2>
    <h3>Subsection C</h3>
      <h4>Detail Point</h4>

<!-- DON'T skip heading levels -->
<!-- BAD: h1 -> h3 (skipped h2) -->

<!-- For visual styling, use CSS instead -->
<h2 class="text-lg">Smaller looking h2</h2>
<h3 class="text-2xl font-bold">Larger looking h3</h3>`,
    wcagCriteria: ['1.3.1', '2.4.6'],
    wcagLevel: 'A',
    testingTools: ['HeadingsMap extension', 'WAVE'],
    automatedFix: false
  },
  'aria-allowed-attr': {
    description: 'ARIA attributes must be valid for the element role',
    recommendation: 'Only use ARIA attributes that are allowed for the specific element role',
    priority: 2,
    effort: 'medium',
    suggestedCode: `<!-- Correct ARIA usage -->
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div id="menu" role="menu" aria-hidden="true">
  <button role="menuitem">Option 1</button>
  <button role="menuitem">Option 2</button>
</div>

<!-- Common patterns -->
<input type="text" aria-invalid="true" aria-describedby="error-msg">
<span id="error-msg" role="alert">Please enter a valid email</span>

<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel2">Tab 2</button>
</div>
<div role="tabpanel" id="panel1">Content 1</div>
<div role="tabpanel" id="panel2" hidden>Content 2</div>`,
    wcagCriteria: ['4.1.2'],
    wcagLevel: 'A',
    testingTools: ['axe DevTools', 'Browser DevTools'],
    automatedFix: false
  },
  'duplicate-id': {
    description: 'Every id attribute value must be unique on the page',
    recommendation: 'Ensure all id attributes have unique values within the document',
    priority: 2,
    effort: 'medium',
    suggestedCode: `<!-- Each ID must be unique -->
<label for="email-1">Personal Email</label>
<input type="email" id="email-1" name="personal_email">

<label for="email-2">Work Email</label>
<input type="email" id="email-2" name="work_email">

<!-- For repeated components, use dynamic IDs -->
const FormField = ({ label, name, index }) => (
  <>
    <label htmlFor={\`\${name}-\${index}\`}>{label}</label>
    <input id={\`\${name}-\${index}\`} name={name} />
  </>
);

<!-- Or use React useId hook -->
import { useId } from 'react';
const FormField = ({ label }) => {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
};`,
    wcagCriteria: ['4.1.1'],
    wcagLevel: 'A',
    testingTools: ['HTML validator', 'axe DevTools'],
    automatedFix: false
  },
  'meta-viewport': {
    description: 'Zooming and scaling must not be disabled in the viewport meta tag',
    recommendation: 'Allow users to zoom by not setting maximum-scale less than 2 or user-scalable=no',
    priority: 1,
    effort: 'low',
    suggestedCode: `<!-- Accessible viewport settings -->
<meta name="viewport" content="width=device-width, initial-scale=1">

<!-- Also acceptable -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">

<!-- DON'T disable zoom -->
<!-- BAD: <meta name="viewport" content="..., maximum-scale=1"> -->
<!-- BAD: <meta name="viewport" content="..., user-scalable=no"> -->
<!-- BAD: <meta name="viewport" content="..., user-scalable=0"> -->`,
    wcagCriteria: ['1.4.4', '1.4.10'],
    wcagLevel: 'AA',
    testingTools: ['Mobile testing', 'axe DevTools'],
    automatedFix: true
  },
  'focus-visible': {
    description: 'Interactive elements must have visible focus indicators',
    recommendation: 'Ensure all focusable elements have a visible focus state, using outline or other visual indicators',
    priority: 1,
    effort: 'medium',
    suggestedCode: `/* Never remove focus outline without replacement */
/* BAD: *:focus { outline: none; } */

/* Good: Custom focus styles */
:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}

/* High contrast focus for dark backgrounds */
.dark-section :focus-visible {
  outline: 3px solid #fbbf24;
  outline-offset: 2px;
}

/* Button focus example */
.btn:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}

/* Card focus example */
.card:focus-within {
  box-shadow: 0 0 0 3px #2563eb;
}`,
    wcagCriteria: ['2.4.7'],
    wcagLevel: 'AA',
    testingTools: ['Keyboard navigation', 'Visual inspection'],
    automatedFix: false
  }
};

// Scan performance optimization - batch processing (optimized for speed)
class ScanQueue {
  constructor(concurrency = 15, delayMs = 10) {
    this.concurrency = concurrency;
    this.delayMs = Math.max(0, delayMs);
    this.queue = [];
    this.running = 0;
    this.results = [];
    this.onProgress = null;
    this.onUrlComplete = null;
    this.aborted = false;
  }

  abort() {
    this.aborted = true;
  }

  async add(url) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.aborted) return;
    
    while (this.queue.length > 0 && this.running < this.concurrency) {
      const task = this.queue.shift();
      this.running++;
      
      try {
        const result = await this.scanUrl(task.url);
        this.results.push(result);
        task.resolve(result);
        
        if (this.onUrlComplete) {
          this.onUrlComplete(task.url, result);
        }
      } catch (error) {
        task.reject(error);
      } finally {
        this.running--;
        
        // Add delay between scans
        if (this.queue.length > 0 && !this.aborted) {
          await new Promise(r => setTimeout(r, this.delayMs));
        }
        
        this.processQueue();
      }
    }
  }

  async scanUrl(url) {
    if (this.onProgress) {
      this.onProgress(`Scanning: ${url}`);
    }
    return await enhancedScanUrl(url);
  }
}

// Configure axe-core with comprehensive WCAG 2.1 AA + best practices
const configureEnhancedAxe = () => {
  axe.configure({
    branding: {
      application: 'Accessibility Scanner Tool'
    },
    rules: [
      // WCAG 2.1 Level A - Perceivable
      { id: 'area-alt', enabled: true },
      { id: 'image-alt', enabled: true },
      { id: 'input-image-alt', enabled: true },
      { id: 'object-alt', enabled: true },
      { id: 'role-img-alt', enabled: true },
      { id: 'svg-img-alt', enabled: true },
      { id: 'video-caption', enabled: true },
      { id: 'audio-caption', enabled: true },
      { id: 'blink', enabled: true },
      { id: 'marquee', enabled: true },
      { id: 'server-side-image-map', enabled: true },
      
      // WCAG 2.1 Level A - Operable
      { id: 'accesskeys', enabled: true },
      { id: 'bypass', enabled: true },
      { id: 'frame-title', enabled: true },
      { id: 'meta-refresh', enabled: true },
      { id: 'focus-order-semantics', enabled: true },
      
      // WCAG 2.1 Level A - Understandable
      { id: 'html-has-lang', enabled: true },
      { id: 'html-lang-valid', enabled: true },
      { id: 'valid-lang', enabled: true },
      { id: 'html-xml-lang-mismatch', enabled: true },
      
      // WCAG 2.1 Level A - Robust
      { id: 'aria-allowed-attr', enabled: true },
      { id: 'aria-command-name', enabled: true },
      { id: 'aria-hidden-body', enabled: true },
      { id: 'aria-hidden-focus', enabled: true },
      { id: 'aria-input-field-name', enabled: true },
      { id: 'aria-meter-name', enabled: true },
      { id: 'aria-progressbar-name', enabled: true },
      { id: 'aria-required-attr', enabled: true },
      { id: 'aria-required-children', enabled: true },
      { id: 'aria-required-parent', enabled: true },
      { id: 'aria-roledescription', enabled: true },
      { id: 'aria-roles', enabled: true },
      { id: 'aria-toggle-field-name', enabled: true },
      { id: 'aria-tooltip-name', enabled: true },
      { id: 'aria-valid-attr', enabled: true },
      { id: 'aria-valid-attr-value', enabled: true },
      { id: 'button-name', enabled: true },
      { id: 'document-title', enabled: true },
      { id: 'duplicate-id', enabled: true },
      { id: 'duplicate-id-active', enabled: true },
      { id: 'duplicate-id-aria', enabled: true },
      { id: 'form-field-multiple-labels', enabled: true },
      { id: 'label', enabled: true },
      { id: 'link-name', enabled: true },
      { id: 'input-button-name', enabled: true },
      
      // WCAG 2.1 Level AA
      { id: 'color-contrast', enabled: true },
      { id: 'meta-viewport', enabled: true },
      { id: 'heading-order', enabled: true },
      { id: 'label-title-only', enabled: true },
      { id: 'landmark-banner-is-top-level', enabled: true },
      { id: 'landmark-complementary-is-top-level', enabled: true },
      { id: 'landmark-contentinfo-is-top-level', enabled: true },
      { id: 'landmark-main-is-top-level', enabled: true },
      { id: 'landmark-no-duplicate-banner', enabled: true },
      { id: 'landmark-no-duplicate-contentinfo', enabled: true },
      { id: 'landmark-no-duplicate-main', enabled: true },
      { id: 'landmark-one-main', enabled: true },
      { id: 'landmark-unique', enabled: true },
      { id: 'page-has-heading-one', enabled: true },
      { id: 'region', enabled: true },
      { id: 'skip-link', enabled: true },
      { id: 'tabindex', enabled: true },
      
      // Additional structure rules
      { id: 'definition-list', enabled: true },
      { id: 'dlitem', enabled: true },
      { id: 'list', enabled: true },
      { id: 'listitem', enabled: true },
      { id: 'scope-attr-valid', enabled: true },
      { id: 'td-headers-attr', enabled: true },
      { id: 'th-has-data-cells', enabled: true },
      
      // Best practices
      { id: 'empty-heading', enabled: true },
      { id: 'frame-tested', enabled: true },
      { id: 'hidden-content', enabled: true },
      { id: 'image-redundant-alt', enabled: true },
      { id: 'link-in-text-block', enabled: true },
      { id: 'no-autoplay-audio', enabled: true },
      { id: 'scrollable-region-focusable', enabled: true },
      { id: 'select-name', enabled: true },
      { id: 'table-duplicate-name', enabled: true },
      { id: 'table-fake-caption', enabled: true },
      { id: 'target-size', enabled: true }
    ],
    locale: {
      lang: 'en',
      rules: {}
    }
  });
};

// Enhanced URL scanning with better error handling and retries
const enhancedScanUrl = async (url, retries = 2) => {
  const startTime = performance.now();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      configureEnhancedAxe();
      
      // Fetch HTML content with multiple fallbacks
      const htmlContent = await fetchWithFallbacks(url);
      
      if (!htmlContent || htmlContent.trim().length < 100) {
        throw new Error('Page content too short or empty');
      }
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Check for parsing errors
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        console.warn(`HTML parsing warning for ${url}:`, parseError.textContent);
      }
      
      // Run comprehensive axe scan
      const results = await axe.run(doc, {
        reporter: 'v2',
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        },
        resultTypes: ['violations', 'passes', 'incomplete', 'inapplicable']
      });
      
      const scanDuration = performance.now() - startTime;
      
      // Format results with enhanced data
      return formatEnhancedResults(results, url, scanDuration, htmlContent.length);
      
    } catch (error) {
      if (attempt === retries) {
        console.error(`Final scan attempt failed for ${url}:`, error);
        return createErrorResult(url, error.message, performance.now() - startTime);
      }
      
      // Quick retry with minimal backoff
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
};

// Fetch URL content with multiple CORS proxy fallbacks
const fetchWithFallbacks = async (url) => {
  const proxies = [
    null, // Direct fetch first
    'https://api.allorigins.win/get?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest='
  ];
  
  for (const proxy of proxies) {
    try {
      const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        mode: proxy ? 'cors' : 'cors',
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = proxy ? await response.json() : await response.text();
      return proxy ? (data.contents || data) : data;
      
    } catch (error) {
      console.warn(`Fetch attempt failed (${proxy || 'direct'}):`, error.message);
      continue;
    }
  }
  
  throw new Error('All fetch attempts failed. The website may block external access.');
};

// Format results with comprehensive data
const formatEnhancedResults = (axeResults, url, scanDuration, contentSize) => {
  const violations = axeResults.violations || [];
  const passes = axeResults.passes || [];
  const incomplete = axeResults.incomplete || [];
  const inapplicable = axeResults.inapplicable || [];
  
  // Enhanced violation grouping with recommendations
  const groupedViolations = {
    critical: [],
    serious: [],
    moderate: [],
    minor: []
  };
  
  // Process violations with enhanced recommendations
  violations.forEach(violation => {
    const severity = violation.impact || 'minor';
    const recommendation = wcagRecommendations[violation.id] || createDefaultRecommendation(violation);
    
    const enhancedViolation = {
      id: violation.id,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      impact: violation.impact,
      severity: severity,
      tags: violation.tags,
      wcagCriteria: extractWcagCriteria(violation.tags),
      recommendation: recommendation,
      nodes: violation.nodes.map(node => ({
        target: node.target,
        html: cleanHtml(node.html),
        snippet: extractCodeSnippet(node.html, 200),
        failureSummary: node.failureSummary,
        xpath: node.xpath || node.target.join(' > '),
        impact: node.impact,
        any: node.any,
        all: node.all,
        none: node.none
      })),
      nodeCount: violation.nodes.length
    };
    
    groupedViolations[severity].push(enhancedViolation);
  });
  
  // Calculate comprehensive statistics
  const stats = calculateStats(groupedViolations, passes, incomplete);
  
  // Calculate accessibility score (0-100)
  const accessibilityScore = calculateAccessibilityScore(stats, violations.length);
  
  // Determine compliance level
  const complianceLevel = determineComplianceLevel(groupedViolations);
  
  return {
    url,
    timestamp: new Date().toISOString(),
    scanDuration: Math.round(scanDuration),
    contentSize,
    accessibilityScore,
    complianceLevel,
    summary: {
      totalViolations: violations.length,
      totalElements: violations.reduce((sum, v) => sum + v.nodes.length, 0),
      passedRules: passes.length,
      incompleteRules: incomplete.length,
      inapplicableRules: inapplicable.length,
      criticalCount: groupedViolations.critical.length,
      seriousCount: groupedViolations.serious.length,
      moderateCount: groupedViolations.moderate.length,
      minorCount: groupedViolations.minor.length
    },
    critical: groupedViolations.critical,
    serious: groupedViolations.serious,
    moderate: groupedViolations.moderate,
    minor: groupedViolations.minor,
    passed: passes.map(pass => ({
      id: pass.id,
      description: pass.description,
      help: pass.help,
      helpUrl: pass.helpUrl,
      tags: pass.tags,
      nodeCount: pass.nodes?.length || 0
    })),
    incomplete: incomplete.map(item => ({
      id: item.id,
      description: item.description,
      help: item.help,
      helpUrl: item.helpUrl,
      tags: item.tags,
      reason: item.nodes?.[0]?.message || 'Requires manual review',
      nodeCount: item.nodes?.length || 0
    })),
    metadata: {
      axeVersion: axe.version,
      wcagLevels: ['A', 'AA'],
      rulesChecked: passes.length + violations.length + incomplete.length + inapplicable.length
    }
  };
};

// Create error result object
const createErrorResult = (url, errorMessage, duration) => ({
  url,
  timestamp: new Date().toISOString(),
  scanDuration: Math.round(duration),
  error: true,
  errorMessage,
  accessibilityScore: null,
  complianceLevel: 'unknown',
  summary: {
    totalViolations: 0,
    totalElements: 0,
    passedRules: 0,
    incompleteRules: 0,
    criticalCount: 0,
    seriousCount: 0,
    moderateCount: 0,
    minorCount: 0
  },
  critical: [],
  serious: [],
  moderate: [],
  minor: [],
  passed: [],
  incomplete: []
});

// Create default recommendation for unknown rules
const createDefaultRecommendation = (violation) => ({
  description: violation.description,
  recommendation: violation.help || 'Please refer to the WCAG guidelines for specific remediation steps.',
  suggestedCode: '// Refer to the help URL for specific code examples',
  wcagCriteria: extractWcagCriteria(violation.tags),
  wcagLevel: extractWcagLevel(violation.tags),
  priority: getPriorityFromImpact(violation.impact),
  effort: 'medium',
  testingTools: ['axe DevTools', 'Screen reader'],
  automatedFix: false
});

// Extract WCAG criteria from tags
const extractWcagCriteria = (tags) => {
  const criteria = [];
  const wcagPattern = /wcag(\d)(\d)(\d+)/;
  
  tags.forEach(tag => {
    const match = tag.match(wcagPattern);
    if (match) {
      criteria.push(`${match[1]}.${match[2]}.${match[3]}`);
    }
  });
  
  return [...new Set(criteria)];
};

// Extract WCAG level from tags
const extractWcagLevel = (tags) => {
  if (tags.some(t => t.includes('aaa'))) return 'AAA';
  if (tags.some(t => t.includes('aa'))) return 'AA';
  return 'A';
};

// Get priority from impact
const getPriorityFromImpact = (impact) => {
  switch (impact) {
    case 'critical': return 1;
    case 'serious': return 2;
    case 'moderate': return 3;
    case 'minor': return 4;
    default: return 3;
  }
};

// Clean HTML for display
const cleanHtml = (html) => {
  if (!html) return '';
  return html.replace(/\s+/g, ' ').trim();
};

// Extract code snippet
const extractCodeSnippet = (html, maxLength = 200) => {
  if (!html) return '';
  let snippet = html.replace(/\s+/g, ' ').trim();
  if (snippet.length > maxLength) {
    snippet = snippet.substring(0, maxLength) + '...';
  }
  return snippet;
};

// Calculate detailed statistics
const calculateStats = (groupedViolations, passes, incomplete) => {
  const totalIssues = 
    groupedViolations.critical.length + 
    groupedViolations.serious.length + 
    groupedViolations.moderate.length + 
    groupedViolations.minor.length;
  
  const totalElements = 
    groupedViolations.critical.reduce((sum, v) => sum + v.nodeCount, 0) +
    groupedViolations.serious.reduce((sum, v) => sum + v.nodeCount, 0) +
    groupedViolations.moderate.reduce((sum, v) => sum + v.nodeCount, 0) +
    groupedViolations.minor.reduce((sum, v) => sum + v.nodeCount, 0);
  
  return {
    totalIssues,
    totalElements,
    passedRules: passes.length,
    incompleteRules: incomplete.length,
    issueBreakdown: {
      critical: groupedViolations.critical.length,
      serious: groupedViolations.serious.length,
      moderate: groupedViolations.moderate.length,
      minor: groupedViolations.minor.length
    }
  };
};

// Calculate accessibility score (0-100)
const calculateAccessibilityScore = (stats, violationCount) => {
  if (stats.passedRules === 0 && violationCount === 0) {
    return 0; // No rules checked
  }
  
  const totalRules = stats.passedRules + violationCount;
  const baseScore = (stats.passedRules / totalRules) * 100;
  
  // Apply penalties for critical/serious issues
  const criticalPenalty = stats.issueBreakdown.critical * 10;
  const seriousPenalty = stats.issueBreakdown.serious * 5;
  const moderatePenalty = stats.issueBreakdown.moderate * 2;
  const minorPenalty = stats.issueBreakdown.minor * 0.5;
  
  const totalPenalty = criticalPenalty + seriousPenalty + moderatePenalty + minorPenalty;
  
  return Math.max(0, Math.round(baseScore - totalPenalty));
};

// Determine compliance level
const determineComplianceLevel = (groupedViolations) => {
  if (groupedViolations.critical.length > 0) {
    return 'non-compliant';
  }
  if (groupedViolations.serious.length > 0) {
    return 'partial';
  }
  if (groupedViolations.moderate.length > 0 || groupedViolations.minor.length > 0) {
    return 'mostly-compliant';
  }
  return 'compliant';
};

// Enhanced multi-URL scanning with queue management
export const enhancedScanMultipleUrls = async (urls, options = {}) => {
  const {
    concurrency = 15,
    delayMs = 10,
    onProgress = null,
    onUrlComplete = null
  } = options;

  const queue = new ScanQueue(concurrency, delayMs);
  queue.onProgress = onProgress;
  
  const results = [];
  const totalUrls = urls.length;
  let completed = 0;
  
  queue.onUrlComplete = (url, result) => {
    results.push(result);
    completed += 1;
    if (onUrlComplete) {
      onUrlComplete(url, result, completed, totalUrls);
    }
  };
  
  const tasks = urls.map((urlData, index) => {
    const url = typeof urlData === 'string' ? urlData : urlData.url;
    if (onProgress) {
      onProgress(`Queuing ${index + 1}/${totalUrls}: ${url}`);
    }
    return queue.add(url).catch(error => {
      console.error(`Error scanning ${url}:`, error);
      const errorResult = createErrorResult(url, error.message, 0);
      results.push(errorResult);
      completed += 1;
      if (onUrlComplete) {
        onUrlComplete(url, errorResult, completed, totalUrls);
      }
      return errorResult;
    });
  });
  
  await Promise.all(tasks);
  
  return createCombinedResults(results);
};

// Create combined results from multiple URL scans
const createCombinedResults = (results) => {
  const successfulScans = results.filter(r => !r.error);
  const failedScans = results.filter(r => r.error);
  
  // Aggregate all violations
  const allCritical = successfulScans.flatMap(r => (r.critical || []).map(v => ({ ...v, sourceUrl: r.url })));
  const allSerious = successfulScans.flatMap(r => (r.serious || []).map(v => ({ ...v, sourceUrl: r.url })));
  const allModerate = successfulScans.flatMap(r => (r.moderate || []).map(v => ({ ...v, sourceUrl: r.url })));
  const allMinor = successfulScans.flatMap(r => (r.minor || []).map(v => ({ ...v, sourceUrl: r.url })));
  
  // Calculate overall statistics
  const overallSummary = {
    totalViolations: successfulScans.reduce((sum, r) => sum + (r.summary?.totalViolations || 0), 0),
    totalElements: successfulScans.reduce((sum, r) => sum + (r.summary?.totalElements || 0), 0),
    passedRules: successfulScans.reduce((sum, r) => sum + (r.summary?.passedRules || 0), 0),
    incompleteRules: successfulScans.reduce((sum, r) => sum + (r.summary?.incompleteRules || 0), 0),
    criticalCount: allCritical.length,
    seriousCount: allSerious.length,
    moderateCount: allModerate.length,
    minorCount: allMinor.length
  };
  
  // Calculate average accessibility score
  const scores = successfulScans.map(r => r.accessibilityScore).filter(s => s !== null);
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  
  // Determine overall compliance
  const overallCompliance = determineComplianceLevel({
    critical: allCritical,
    serious: allSerious,
    moderate: allModerate,
    minor: allMinor
  });
  
  // Identify most common issues across all pages
  const issueFrequency = {};
  [...allCritical, ...allSerious, ...allModerate, ...allMinor].forEach(v => {
    if (!issueFrequency[v.id]) {
      issueFrequency[v.id] = {
        id: v.id,
        help: v.help,
        severity: v.severity,
        count: 0,
        pages: new Set()
      };
    }
    issueFrequency[v.id].count++;
    issueFrequency[v.id].pages.add(v.sourceUrl);
  });
  
  const commonIssues = Object.values(issueFrequency)
    .map(i => ({ ...i, pages: i.pages.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    timestamp: new Date().toISOString(),
    totalUrls: results.length,
    successfulScans: successfulScans.length,
    failedScans: failedScans.length,
    averageAccessibilityScore: averageScore,
    overallCompliance,
    overallSummary,
    commonIssues,
    urlResults: results,
    // For backward compatibility, also include flattened arrays
    summary: overallSummary,
    critical: allCritical,
    serious: allSerious,
    moderate: allModerate,
    minor: allMinor
  };
};

// Single URL scan export
export const enhancedScanUrl_export = enhancedScanUrl;

// Export for use in other modules
export { wcagRecommendations, ScanQueue };
