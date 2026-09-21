#!/usr/bin/env node

import { chromium } from 'playwright';
import { parseString } from 'xml2js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { URL } from 'url';

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

// Accessible name algorithm implementation
function computeAccessibleName(element) {
  // Priority order based on ARIA specification
  
  // 1. aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim();
  }
  
  // 2. aria-labelledby
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const ids = ariaLabelledby.split(' ');
    const texts = [];
    for (const id of ids) {
      const referencedElement = document.getElementById(id);
      if (referencedElement) {
        texts.push(referencedElement.textContent.trim());
      }
    }
    if (texts.length > 0) {
      return texts.join(' ').trim();
    }
  }
  
  // 3. alt attribute for images
  if (element.tagName === 'IMG') {
    const alt = element.getAttribute('alt');
    if (alt !== null) {
      return alt.trim();
    }
  }
  
  // 4. innerText or textContent
  if (element.innerText && element.innerText.trim()) {
    return element.innerText.trim();
  }
  
  if (element.textContent && element.textContent.trim()) {
    return element.textContent.trim();
  }
  
  // 5. title attribute
  const title = element.getAttribute('title');
  if (title && title.trim()) {
    return title.trim();
  }
  
  return '';
}

// Fetch and parse sitemap
async function fetchSitemap(baseUrl) {
  try {
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    console.log(`🗺️ Fetching sitemap: ${sitemapUrl}`);
    
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      console.log(`⚠️ Sitemap not found, using homepage only`);
      return [baseUrl];
    }
    
    const sitemapXml = await response.text();
    
    return new Promise((resolve, reject) => {
      parseString(sitemapXml, (err, result) => {
        if (err) {
          console.log(`⚠️ Error parsing sitemap, using homepage only`);
          resolve([baseUrl]);
          return;
        }
        
        const urls = [];
        
        // Handle sitemap index
        if (result.sitemapindex) {
          console.log(`📋 Found sitemap index with ${result.sitemapindex.sitemap.length} sitemaps`);
          // For simplicity, just use the first few sitemaps
          const sitemapsToProcess = result.sitemapindex.sitemap.slice(0, 3);
          for (const sitemap of sitemapsToProcess) {
            urls.push(sitemap.loc[0]);
          }
        }
        
        // Handle regular sitemap
        if (result.urlset && result.urlset.url) {
          console.log(`📄 Found ${result.urlset.url.length} URLs in sitemap`);
          // Limit to first 20 URLs to avoid overwhelming
          const urlsToProcess = result.urlset.url.slice(0, 20);
          for (const url of urlsToProcess) {
            urls.push(url.loc[0]);
          }
        }
        
        if (urls.length === 0) {
          urls.push(baseUrl);
        }
        
        resolve(urls);
      });
    });
  } catch (error) {
    console.log(`⚠️ Error fetching sitemap: ${error.message}`);
    return [baseUrl];
  }
}

// Extract accessibility data from a page
async function extractAccessibilityData(page, pageUrl) {
  console.log(`🔍 Analyzing: ${pageUrl}`);
  
  try {
    await page.goto(pageUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Extract all images, links, and interactive elements
    const data = await page.evaluate((computeAccessibleNameStr) => {
      // Inject the computeAccessibleName function into page context
      const computeAccessibleName = new Function('element', computeAccessibleNameStr);
      
      const results = [];
      
      // Helper function to make URLs absolute
      function makeAbsolute(url) {
        if (!url) return '';
        try {
          return new URL(url, window.location.href).href;
        } catch {
          return url;
        }
      }
      
      // Extract all images
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        const src = img.getAttribute('src');
        if (src) {
          const computedName = computeAccessibleName(img);
          results.push({
            type: 'image',
            elementId: `img_${index}`,
            pageUrl: window.location.href,
            src: makeAbsolute(src),
            alt: img.getAttribute('alt') || '',
            width: img.width || img.getAttribute('width') || '',
            height: img.height || img.getAttribute('height') || '',
            role: img.getAttribute('role') || '',
            ariaLabel: img.getAttribute('aria-label') || '',
            ariaLabelledby: img.getAttribute('aria-labelledby') || '',
            ariaDescribedby: img.getAttribute('aria-describedby') || '',
            computedName: computedName,
            linkHref: '',
            linkText: '',
            linkTarget: '',
            linkRel: ''
          });
        }
      });
      
      // Extract all links
      const links = document.querySelectorAll('a[href]');
      links.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (href) {
          const computedName = computeAccessibleName(link);
          results.push({
            type: 'link',
            elementId: `link_${index}`,
            pageUrl: window.location.href,
            src: '',
            alt: '',
            width: '',
            height: '',
            role: link.getAttribute('role') || '',
            ariaLabel: link.getAttribute('aria-label') || '',
            ariaLabelledby: link.getAttribute('aria-labelledby') || '',
            ariaDescribedby: link.getAttribute('aria-describedby') || '',
            computedName: computedName,
            linkHref: makeAbsolute(href),
            linkText: link.innerText.trim(),
            linkTarget: link.getAttribute('target') || '',
            linkRel: link.getAttribute('rel') || ''
          });
        }
      });
      
      // Extract interactive/role-bearing elements
      const interactiveSelectors = [
        'button',
        'input',
        'select',
        'textarea',
        '[role]',
        '[tabindex]',
        '[aria-label]',
        '[aria-labelledby]'
      ];
      
      const interactiveElements = document.querySelectorAll(interactiveSelectors.join(','));
      interactiveElements.forEach((element, index) => {
        // Skip if already captured as image or link
        if (element.tagName === 'IMG' || (element.tagName === 'A' && element.hasAttribute('href'))) {
          return;
        }
        
        const computedName = computeAccessibleName(element);
        results.push({
          type: 'interactive',
          elementId: `interactive_${element.tagName.toLowerCase()}_${index}`,
          pageUrl: window.location.href,
          src: '',
          alt: '',
          width: '',
          height: '',
          role: element.getAttribute('role') || element.tagName.toLowerCase(),
          ariaLabel: element.getAttribute('aria-label') || '',
          ariaLabelledby: element.getAttribute('aria-labelledby') || '',
          ariaDescribedby: element.getAttribute('aria-describedby') || '',
          computedName: computedName,
          linkHref: '',
          linkText: element.innerText ? element.innerText.trim().substring(0, 100) : '',
          linkTarget: '',
          linkRel: ''
        });
      });
      
      return results;
    }, computeAccessibleName.toString());
    
    console.log(`✅ Found ${data.length} accessibility elements on ${pageUrl}`);
    return data;
    
  } catch (error) {
    console.log(`❌ Error analyzing ${pageUrl}: ${error.message}`);
    return [];
  }
}

// Generate Excel file
async function generateExcelReport(allData, websiteName) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Accessibility Audit');
  
  // Define columns
  worksheet.columns = [
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Page URL', key: 'pageUrl', width: 50 },
    { header: 'Element ID', key: 'elementId', width: 20 },
    { header: 'Image Source', key: 'src', width: 50 },
    { header: 'Alt Text', key: 'alt', width: 30 },
    { header: 'Width', key: 'width', width: 10 },
    { header: 'Height', key: 'height', width: 10 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'ARIA Label', key: 'ariaLabel', width: 30 },
    { header: 'ARIA Labelledby', key: 'ariaLabelledby', width: 20 },
    { header: 'ARIA Describedby', key: 'ariaDescribedby', width: 20 },
    { header: 'Computed Name', key: 'computedName', width: 40 },
    { header: 'Link Href', key: 'linkHref', width: 50 },
    { header: 'Link Text', key: 'linkText', width: 30 },
    { header: 'Link Target', key: 'linkTarget', width: 12 },
    { header: 'Link Rel', key: 'linkRel', width: 15 }
  ];
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };
  
  // Add data
  allData.forEach(item => {
    worksheet.addRow(item);
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.width < 15) column.width = 15;
    if (column.width > 60) column.width = 60;
  });
  
  // Save file
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `accessibility-audit-${websiteName}-${timestamp}.xlsx`;
  const filepath = `test-results/${filename}`;
  
  await workbook.xlsx.writeFile(filepath);
  console.log(`📊 Excel report saved: ${filepath}`);
  
  return filepath;
}

// Main function
async function analyzeWebsite(websiteName) {
  const url = websites[websiteName.toLowerCase()];
  
  if (!url) {
    console.log(`❌ Website '${websiteName}' not found.`);
    console.log('Available websites:');
    Object.keys(websites).forEach(name => console.log(`  - ${name}`));
    return;
  }

  console.log(`🚀 Starting accessibility analysis for ${websiteName} (${url})`);
  console.log(`📅 Analysis Date: ${new Date().toLocaleString()}`);
  console.log('==================================================');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Get URLs from sitemap
    const urls = await fetchSitemap(url);
    console.log(`📋 Will analyze ${urls.length} pages`);
    
    const allData = [];
    
    // Analyze each page
    for (let i = 0; i < urls.length; i++) {
      const pageUrl = urls[i];
      console.log(`\n🔍 Progress: ${i + 1}/${urls.length}`);
      
      const pageData = await extractAccessibilityData(page, pageUrl);
      allData.push(...pageData);
      
      // Add a small delay to be respectful to the server
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✅ Analysis complete! Found ${allData.length} total elements`);
    
    // Generate Excel report
    const reportPath = await generateExcelReport(allData, websiteName);
    
    // Summary
    const imageCount = allData.filter(item => item.type === 'image').length;
    const linkCount = allData.filter(item => item.type === 'link').length;
    const interactiveCount = allData.filter(item => item.type === 'interactive').length;
    const missingAltCount = allData.filter(item => 
      item.type === 'image' && !item.alt && !item.ariaLabel
    ).length;
    const emptyLinksCount = allData.filter(item => 
      item.type === 'link' && !item.computedName
    ).length;
    
    console.log('\n📊 ACCESSIBILITY SUMMARY');
    console.log('==============================');
    console.log(`Website: ${websiteName}`);
    console.log(`Pages analyzed: ${urls.length}`);
    console.log(`Total elements: ${allData.length}`);
    console.log(`Images: ${imageCount}`);
    console.log(`Links: ${linkCount}`);
    console.log(`Interactive elements: ${interactiveCount}`);
    console.log(`Images missing alt text: ${missingAltCount} ${missingAltCount > 0 ? '⚠️' : '✅'}`);
    console.log(`Links with empty accessible name: ${emptyLinksCount} ${emptyLinksCount > 0 ? '⚠️' : '✅'}`);
    console.log(`\n📄 Report saved: ${reportPath}`);

  } catch (error) {
    console.log(`❌ Analysis failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// CLI usage
const websiteName = process.argv[2];

if (!websiteName) {
  console.log('Usage: node accessibility-analyzer.js <website-name>');
  console.log('\nAvailable websites:');
  Object.keys(websites).forEach(name => console.log(`  - ${name}`));
  console.log('\nExample: node accessibility-analyzer.js always');
  process.exit(1);
}

// Ensure directories exist
['test-results'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run the analysis
analyzeWebsite(websiteName);
