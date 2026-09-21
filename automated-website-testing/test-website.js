#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Website configurations
const websites = {
  'tampax': 'https://www.tampax.com',
  'tampax.fr': 'https://www.tampax.fr/fr-fr',
  'tampax.uk': 'https://tampax.co.uk/en-gb',
  'tampax.eu': 'https://www.tampax.eu',
  'naturella': 'https://www.naturella.com.mx',
  'naturella.mx': 'https://www.naturella.com.mx',
  'alwaysdiscreet': 'https://alwaysdiscreet.com',
  'alwaysdiscreet.de': 'https://www.alwaysdiscreet.de',
  'alwaysdiscreet.fr': 'https://www.alwaysdiscreet.fr',
  'alwaysdiscreet.uk': 'https://www.alwaysdiscreet.co.uk',
  'alwaysdiscreet.au': 'https://www.alwaysdiscreet.com.au',
  'alwaysdiscreet.ca': 'https://www.alwaysdiscreet.ca/fr-ca',
  'evaxtampax': 'https://www.evaxtampax.es',
  'evaxtampax.es': 'https://www.evaxtampax.es',
  'evaxtampax.pt': 'https://www.evaxtampax.pt',
  'always': 'https://www.always.com',
  'always.de': 'https://www.always.de',
  'always.fr': 'https://www.always.fr',
  'always.uk': 'https://www.always.co.uk',
  'always.eu': 'https://www.always.eu',
  'alwayslatam': 'https://www.alwayslatam.com',
  'alwaysbrasil': 'https://www.alwaysbrasil.com.br/pt-br',
  'alwaysarabia': 'https://alwaysarabia.com/en-sa',
  'always-africa': 'https://always-africa.com',
  'ausonia': 'https://www.ausonia.es/es-es',
  'ausonia.es': 'https://www.ausonia.es/es-es',
  'ausonia.pt': 'https://www.ausonia.pt/pt-pt',
  'ausonia.eu': 'https://www.ausonia.eu',
  'whisper': 'https://www.whisper.jp',
  'whisper.jp': 'https://www.whisper.jp',
  'whisper.in': 'https://whisper.co.in/en-in',
  'mydziewczyny': 'https://www.mydziewczyny.pl',
  'thisisl': 'https://www.thisisl.com'
};

async function testWebsite(websiteName) {
  const url = websites[websiteName.toLowerCase()];
  
  if (!url) {
    console.log(`❌ Website '${websiteName}' not found.`);
    console.log('Available websites:');
    Object.keys(websites).forEach(name => console.log(`  - ${name}`));
    return;
  }

  console.log(`🚀 Testing ${websiteName} (${url})`);
  console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
  console.log('==================================================');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const report = {
    website: websiteName,
    url: url,
    testDate: new Date().toISOString(),
    results: {}
  };

  try {
    // Start timing
    const startTime = Date.now();
    
    // Navigate to website
    console.log('📡 Loading website...');
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Basic checks
    const status = response.status();
    const title = await page.title();
    
    console.log(`✅ Status: ${status}`);
    console.log(`✅ Load Time: ${loadTime}ms`);
    console.log(`✅ Title: ${title}`);
    
    report.results.status = status;
    report.results.loadTime = loadTime;
    report.results.title = title;
    report.results.passed = status < 400;

    // Check critical elements
    console.log('\n🔍 Checking critical elements...');
    const elements = ['header', 'nav', 'main', 'footer'];
    const elementResults = {};
    
    for (const element of elements) {
      try {
        await page.waitForSelector(element, { timeout: 5000 });
        console.log(`  ✅ ${element} found`);
        elementResults[element] = true;
      } catch {
        console.log(`  ❌ ${element} missing`);
        elementResults[element] = false;
      }
    }
    
    report.results.elements = elementResults;

    // Performance metrics
    console.log('\n⚡ Performance metrics...');
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
        loadComplete: Math.round(perfData.loadEventEnd - perfData.fetchStart)
      };
    });
    
    console.log(`  ✅ DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  ✅ Load Complete: ${metrics.loadComplete}ms`);
    
    report.results.performance = metrics;

    // Mobile check
    console.log('\n📱 Mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const isMobileResponsive = await page.evaluate(() => {
      const viewport = document.querySelector('meta[name="viewport"]');
      return viewport && viewport.getAttribute('content').includes('width=device-width');
    });
    
    console.log(`  ${isMobileResponsive ? '✅' : '❌'} Mobile viewport configured`);
    report.results.mobileResponsive = isMobileResponsive;

    // Screenshot
    console.log('\n📸 Taking screenshot...');
    const screenshotPath = `test-results/screenshots/${websiteName}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`  ✅ Screenshot saved: ${screenshotPath}`);
    report.results.screenshot = screenshotPath;

    // Generate summary
    console.log('\n📊 TEST SUMMARY');
    console.log('==============================');
    console.log(`Website: ${websiteName}`);
    console.log(`Status: ${status < 400 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Load Time: ${loadTime}ms ${loadTime < 3000 ? '✅' : '⚠️'}`);
    console.log(`Elements: ${Object.values(elementResults).filter(Boolean).length}/${elements.length} found`);
    console.log(`Mobile: ${isMobileResponsive ? '✅ Responsive' : '❌ Not responsive'}`);

    // Save report
    const reportPath = `test-results/reports/${websiteName}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved: ${reportPath}`);

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    report.results.error = error.message;
    report.results.passed = false;
  } finally {
    await browser.close();
  }

  return report;
}

// CLI usage
const websiteName = process.argv[2];

if (!websiteName) {
  console.log('Usage: node test-website.js <website-name>');
  console.log('\nAvailable websites:');
  Object.keys(websites).forEach(name => console.log(`  - ${name}`));
  console.log('\nExample: node test-website.js tampax');
  process.exit(1);
}

// Ensure directories exist
['test-results', 'test-results/screenshots', 'test-results/reports'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run the test
testWebsite(websiteName);
