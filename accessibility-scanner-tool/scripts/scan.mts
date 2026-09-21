#!/usr/bin/env tsx

import { Command } from 'commander';
import { chromium, Browser, Page } from 'playwright';
import axe from 'axe-core';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';

// Types for configuration
interface SiteConfig {
  siteId: string;
  name: string;
  baseUrl: string;
  sitemapUrl?: string;
  includePatterns: string[];
  excludePatterns: string[];
  maxDepth: number;
  maxPages: number;
  axeTags: string[];
  politeDelayMs: number;
  concurrency: number;
  pageTimeoutMs: number;
  auth?: {
    type: 'basic' | 'cookie';
    username?: string;
    password?: string;
    cookies?: Array<{ name: string; value: string; domain: string }>;
  };
}

interface GlobalDefaults {
  maxDepth: number;
  maxPages: number;
  axeTags: string[];
  politeDelayMs: number;
  concurrency: number;
  pageTimeoutMs: number;
  blockedDomains: string[];
}

interface SitesConfig {
  sites: SiteConfig[];
  globalDefaults: GlobalDefaults;
}

interface AxeViolation {
  ruleId: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    target: string[];
    html: string;
    failureSummary: string;
  }>;
}

interface PageScanResult {
  url: string;
  timestamp: string;
  loadTime: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
  issues: AxeViolation[];
  totalIssues: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
}

interface ScanSummary {
  siteId: string;
  generatedAt: string;
  pageCount: number;
  successfulPages: number;
  failedPages: number;
  totals: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  scanDuration: number;
}

interface FullScanResult {
  siteId: string;
  generatedAt: string;
  pages: PageScanResult[];
}

class AccessibilityScanner {
  private browser: Browser | null = null;
  private config: SiteConfig;
  private defaults: GlobalDefaults;

  constructor(config: SiteConfig, defaults: GlobalDefaults) {
    this.config = { ...defaults, ...config };
    this.defaults = defaults;
  }

  async initialize(): Promise<void> {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async discoverPages(): Promise<string[]> {
    const pages = new Set<string>();
    
    // Try sitemap first if provided
    if (this.config.sitemapUrl) {
      console.log(`📊 Parsing sitemap: ${this.config.sitemapUrl}`);
      try {
        const sitemapPages = await this.parseSitemap(this.config.sitemapUrl);
        sitemapPages.forEach(url => pages.add(url));
        console.log(`✅ Found ${sitemapPages.length} URLs from sitemap`);
      } catch (error) {
        console.warn(`⚠️ Sitemap parsing failed: ${error.message}`);
      }
    }

    // If no pages from sitemap or no sitemap, crawl from base URL
    if (pages.size === 0) {
      console.log(`🕸️ Crawling from base URL: ${this.config.baseUrl}`);
      const crawledPages = await this.crawlPages(this.config.baseUrl);
      crawledPages.forEach(url => pages.add(url));
      console.log(`✅ Found ${crawledPages.length} URLs from crawling`);
    }

    // Filter and limit pages
    const filteredPages = Array.from(pages)
      .filter(url => this.shouldIncludePage(url))
      .slice(0, this.config.maxPages);

    console.log(`📋 Final page list: ${filteredPages.length} URLs to scan`);
    return filteredPages;
  }

  private async parseSitemap(sitemapUrl: string): Promise<string[]> {
    const context = await this.browser!.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto(sitemapUrl, { timeout: this.config.pageTimeoutMs });
      const content = await page.content();
      const urls: string[] = [];
      
      // Parse XML sitemap
      const urlMatches = content.match(/<loc[^>]*>([^<]+)<\/loc>/g);
      if (urlMatches) {
        for (const match of urlMatches) {
          const url = match.replace(/<\/?loc[^>]*>/g, '').trim();
          if (this.isValidUrl(url) && this.isSameDomain(url)) {
            urls.push(url);
          }
        }
      }
      
      return urls;
    } finally {
      await context.close();
    }
  }

  private async crawlPages(startUrl: string, depth = 0): Promise<string[]> {
    if (depth >= this.config.maxDepth) return [];
    
    const urls = new Set<string>();
    const context = await this.browser!.newContext();
    
    try {
      const page = await context.newPage();
      await this.setupPageBlocking(page);
      
      await page.goto(startUrl, { timeout: this.config.pageTimeoutMs });
      
      // Extract links
      const links = await page.$$eval('a[href]', anchors => 
        anchors.map(a => (a as HTMLAnchorElement).href)
      );
      
      for (const link of links) {
        if (this.isValidUrl(link) && this.isSameDomain(link) && this.shouldIncludePage(link)) {
          urls.add(link);
          
          // Recursive crawling for next depth level
          if (depth < this.config.maxDepth - 1) {
            const nestedUrls = await this.crawlPages(link, depth + 1);
            nestedUrls.forEach(url => urls.add(url));
          }
        }
      }
      
      return Array.from(urls);
    } catch (error) {
      console.warn(`⚠️ Failed to crawl ${startUrl}: ${error.message}`);
      return [];
    } finally {
      await context.close();
    }
  }

  private async setupPageBlocking(page: Page): Promise<void> {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      const shouldBlock = this.defaults.blockedDomains.some(domain => 
        url.includes(domain)
      );
      
      if (shouldBlock) {
        route.abort();
      } else {
        route.continue();
      }
    });
  }

  private shouldIncludePage(url: string): boolean {
    // Check include patterns
    const included = this.config.includePatterns.length === 0 || 
      this.config.includePatterns.some(pattern => new RegExp(pattern).test(url));
    
    // Check exclude patterns
    const excluded = this.config.excludePatterns.some(pattern => 
      new RegExp(pattern).test(url)
    );
    
    return included && !excluded;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isSameDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(this.config.baseUrl);
      return urlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  }

  async scanPage(url: string): Promise<PageScanResult> {
    const startTime = Date.now();
    const context = await this.browser!.newContext();
    
    try {
      console.log(`🔍 Scanning: ${url}`);
      
      const page = await context.newPage();
      await this.setupPageBlocking(page);
      
      // Setup authentication if needed
      if (this.config.auth) {
        await this.setupAuthentication(page, this.config.auth);
      }
      
      // Navigate to page
      await page.goto(url, { 
        timeout: this.config.pageTimeoutMs,
        waitUntil: 'networkidle'
      });
      
      // Inject axe-core
      await page.addScriptTag({
        content: axe.source
      });
      
      // Run axe scan
      const axeResults = await page.evaluate((axeTags) => {
        return (window as any).axe.run(document, {
          runOnly: {
            type: 'tag',
            values: axeTags
          },
          resultTypes: ['violations']
        });
      }, this.config.axeTags);
      
      // Process results
      const issues: AxeViolation[] = axeResults.violations.map((violation: any) => ({
        ruleId: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        nodes: violation.nodes.map((node: any) => ({
          target: node.target,
          html: node.html.substring(0, 256) + (node.html.length > 256 ? '...' : ''),
          failureSummary: node.failureSummary
        }))
      }));
      
      const loadTime = Date.now() - startTime;
      
      // Count issues by impact
      const counts = {
        critical: issues.filter(i => i.impact === 'critical').length,
        serious: issues.filter(i => i.impact === 'serious').length,
        moderate: issues.filter(i => i.impact === 'moderate').length,
        minor: issues.filter(i => i.impact === 'minor').length
      };
      
      return {
        url,
        timestamp: new Date().toISOString(),
        loadTime,
        status: 'success',
        issues,
        totalIssues: issues.length,
        criticalCount: counts.critical,
        seriousCount: counts.serious,
        moderateCount: counts.moderate,
        minorCount: counts.minor
      };
      
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error(`❌ Failed to scan ${url}: ${error.message}`);
      
      return {
        url,
        timestamp: new Date().toISOString(),
        loadTime,
        status: 'error',
        errorMessage: error.message,
        issues: [],
        totalIssues: 0,
        criticalCount: 0,
        seriousCount: 0,
        moderateCount: 0,
        minorCount: 0
      };
      
    } finally {
      await context.close();
    }
  }

  private async setupAuthentication(page: Page, auth: NonNullable<SiteConfig['auth']>): Promise<void> {
    if (auth.type === 'basic' && auth.username && auth.password) {
      await page.setExtraHTTPHeaders({
        'Authorization': `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
      });
    } else if (auth.type === 'cookie' && auth.cookies) {
      await page.context().addCookies(auth.cookies);
    }
  }

  async scanSite(): Promise<{ summary: ScanSummary; fullResults: FullScanResult }> {
    const scanStartTime = Date.now();
    console.log(`🏁 Starting accessibility scan for: ${this.config.name}`);
    
    const pages = await this.discoverPages();
    const results: PageScanResult[] = [];
    
    // Scan pages with concurrency control
    const batches = this.chunkArray(pages, this.config.concurrency);
    
    for (const batch of batches) {
      const batchPromises = batch.map(url => this.scanPage(url));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Polite delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(this.config.politeDelayMs);
      }
    }
    
    // Generate summary
    const scanDuration = Date.now() - scanStartTime;
    const successfulPages = results.filter(r => r.status === 'success').length;
    const totals = results.reduce(
      (acc, result) => ({
        critical: acc.critical + result.criticalCount,
        serious: acc.serious + result.seriousCount,
        moderate: acc.moderate + result.moderateCount,
        minor: acc.minor + result.minorCount
      }),
      { critical: 0, serious: 0, moderate: 0, minor: 0 }
    );
    
    const summary: ScanSummary = {
      siteId: this.config.siteId,
      generatedAt: new Date().toISOString(),
      pageCount: results.length,
      successfulPages,
      failedPages: results.length - successfulPages,
      totals,
      scanDuration
    };
    
    const fullResults: FullScanResult = {
      siteId: this.config.siteId,
      generatedAt: new Date().toISOString(),
      pages: results
    };
    
    console.log(`✅ Scan complete: ${successfulPages}/${results.length} pages successful`);
    console.log(`📊 Total issues: ${totals.critical + totals.serious + totals.moderate + totals.minor}`);
    
    return { summary, fullResults };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ReportGenerator {
  private reportDir: string;

  constructor(siteId: string, timestamp: string) {
    this.reportDir = path.join(process.cwd(), 'reports', siteId, timestamp.replace(/:/g, '-'));
  }

  async ensureReportDirectory(): Promise<void> {
    await fs.mkdir(this.reportDir, { recursive: true });
  }

  async generateAllReports(summary: ScanSummary, fullResults: FullScanResult): Promise<void> {
    await this.ensureReportDirectory();
    
    console.log(`📁 Generating reports in: ${this.reportDir}`);
    
    // Generate JSON reports
    await this.generateSummaryJson(summary);
    await this.generateFullJson(fullResults);
    await this.generateFilteredJson(fullResults, 'critical');
    await this.generateFilteredJson(fullResults, 'serious');
    
    // Generate CSV reports
    await this.generateFullCsv(fullResults);
    await this.generateFilteredCsv(fullResults, 'critical');
    await this.generateFilteredCsv(fullResults, 'serious');
    
    console.log(`✅ All reports generated in: ${this.reportDir}`);
  }

  private async generateSummaryJson(summary: ScanSummary): Promise<void> {
    const filePath = path.join(this.reportDir, 'summary.json');
    await fs.writeFile(filePath, JSON.stringify(summary, null, 2));
    console.log(`📄 Generated: summary.json`);
  }

  private async generateFullJson(fullResults: FullScanResult): Promise<void> {
    const filePath = path.join(this.reportDir, 'full.json');
    await fs.writeFile(filePath, JSON.stringify(fullResults, null, 2));
    console.log(`📄 Generated: full.json`);
  }

  private async generateFilteredJson(fullResults: FullScanResult, severity: 'critical' | 'serious'): Promise<void> {
    const filtered = {
      ...fullResults,
      pages: fullResults.pages.map(page => ({
        ...page,
        issues: page.issues.filter(issue => issue.impact === severity)
      })).filter(page => page.issues.length > 0)
    };
    
    const filePath = path.join(this.reportDir, `${severity}.json`);
    await fs.writeFile(filePath, JSON.stringify(filtered, null, 2));
    console.log(`📄 Generated: ${severity}.json`);
  }

  private async generateFullCsv(fullResults: FullScanResult): Promise<void> {
    const csvRows = ['siteId,generatedAt,pageUrl,ruleId,impact,description,helpUrl,cssTarget,snippet'];
    
    for (const page of fullResults.pages) {
      for (const issue of page.issues) {
        for (const node of issue.nodes) {
          const row = [
            fullResults.siteId,
            fullResults.generatedAt,
            page.url,
            issue.ruleId,
            issue.impact,
            this.escapeCsv(issue.description),
            issue.helpUrl,
            this.escapeCsv(node.target.join(', ')),
            this.escapeCsv(node.html)
          ].join(',');
          csvRows.push(row);
        }
      }
    }
    
    const filePath = path.join(this.reportDir, 'full.csv');
    await fs.writeFile(filePath, csvRows.join('\\n'));
    console.log(`📄 Generated: full.csv`);
  }

  private async generateFilteredCsv(fullResults: FullScanResult, severity: 'critical' | 'serious'): Promise<void> {
    const csvRows = ['siteId,generatedAt,pageUrl,ruleId,impact,description,helpUrl,cssTarget,snippet'];
    
    for (const page of fullResults.pages) {
      for (const issue of page.issues.filter(i => i.impact === severity)) {
        for (const node of issue.nodes) {
          const row = [
            fullResults.siteId,
            fullResults.generatedAt,
            page.url,
            issue.ruleId,
            issue.impact,
            this.escapeCsv(issue.description),
            issue.helpUrl,
            this.escapeCsv(node.target.join(', ')),
            this.escapeCsv(node.html)
          ].join(',');
          csvRows.push(row);
        }
      }
    }
    
    const filePath = path.join(this.reportDir, `${severity}.csv`);
    await fs.writeFile(filePath, csvRows.join('\\n'));
    console.log(`📄 Generated: ${severity}.csv`);
  }

  private escapeCsv(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}

async function loadConfig(): Promise<SitesConfig> {
  const configPath = path.join(process.cwd(), 'config', 'sites.json');
  const configContent = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(configContent);
}

async function main() {
  const program = new Command();
  
  program
    .name('accessibility-scanner')
    .description('Enterprise-grade accessibility scanner using axe-core and Playwright')
    .version('1.0.0');
  
  program
    .command('scan')
    .description('Scan websites for accessibility issues')
    .option('-s, --site <siteId>', 'Scan specific site by ID')
    .option('-a, --all', 'Scan all configured sites')
    .option('-c, --config <path>', 'Custom config file path', 'config/sites.json')
    .action(async (options) => {
      try {
        const config = await loadConfig();
        const sitesToScan = options.site 
          ? config.sites.filter(site => site.siteId === options.site)
          : options.all 
            ? config.sites 
            : [];
        
        if (sitesToScan.length === 0) {
          console.error('❌ No sites to scan. Use --site <siteId> or --all');
          process.exit(1);
        }
        
        for (const siteConfig of sitesToScan) {
          const scanner = new AccessibilityScanner(siteConfig, config.globalDefaults);
          
          try {
            await scanner.initialize();
            const { summary, fullResults } = await scanner.scanSite();
            
            const timestamp = summary.generatedAt.split('T')[0] + 'T' + summary.generatedAt.split('T')[1].split('.')[0];
            const reporter = new ReportGenerator(siteConfig.siteId, timestamp);
            await reporter.generateAllReports(summary, fullResults);
            
          } finally {
            await scanner.cleanup();
          }
        }
        
        console.log('🎉 All scans completed successfully!');
        
      } catch (error) {
        console.error('❌ Scan failed:', error);
        process.exit(1);
      }
    });
  
  await program.parseAsync();
}

// ES module equivalent of require.main === module check
main().catch(console.error);