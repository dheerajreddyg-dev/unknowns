#!/usr/bin/env node

import { chromium } from 'playwright';
import { parseString } from 'xml2js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import { URL } from 'url';

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

// Fetch and parse sitemap using Playwright for better compatibility
async function fetchCustomSitemap(sitemapUrl, browser) {
  try {
    console.log(`🗺️ Fetching sitemap: ${sitemapUrl}`);
    
    // Try different sitemap URL variations
    const sitemapUrls = [
      sitemapUrl,
      sitemapUrl.replace('/sitemap/', '/sitemap.xml'),
      sitemapUrl.replace('/sitemap/', '/sitemap_index.xml'),
      new URL('/sitemap.xml', sitemapUrl).href,
      new URL('/sitemap_index.xml', sitemapUrl).href
    ];
    
    // Remove duplicates
    const uniqueUrls = [...new Set(sitemapUrls)];
    
    let sitemapXml = null;
    let workingUrl = null;
    
    // Create a new page for sitemap fetching
    const sitemapPage = await browser.newPage();
    
    for (const url of uniqueUrls) {
      try {
        console.log(`🔍 Trying: ${url}`);
        
        const response = await sitemapPage.goto(url, { 
          waitUntil: 'networkidle',
          timeout: 15000 
        });
        
        if (response && response.ok()) {
          const text = await sitemapPage.content();
          // Check if it's actually XML content
          if (text.includes('<urlset') || text.includes('<sitemapindex')) {
            sitemapXml = text;
            workingUrl = url;
            console.log(`✅ Found sitemap at: ${url}`);
            break;
          } else {
            console.log(`❌ Invalid XML format: ${url}`);
          }
        } else {
          const status = response ? response.status() : 'No response';
          console.log(`❌ HTTP ${status}: ${url}`);
        }
      } catch (e) {
        console.log(`❌ Failed: ${url} - ${e.message}`);
      }
    }
    
    await sitemapPage.close();
    
    if (!sitemapXml) {
      console.log(`⚠️ No sitemap found, using base URL only`);
      const baseUrl = new URL(sitemapUrl).origin;
      return [baseUrl];
    }
    
    return new Promise(async (resolve, reject) => {
      parseString(sitemapXml, async (err, result) => {
        if (err) {
          console.log(`⚠️ Error parsing sitemap, using base URL only`);
          const baseUrl = new URL(sitemapUrl).origin;
          resolve([baseUrl]);
          return;
        }
        
        const urls = [];
        
        // Handle sitemap index (fetch nested sitemaps)
        if (result.sitemapindex) {
          console.log(`📋 Found sitemap index with ${result.sitemapindex.sitemap.length} sitemaps`);
          // Fetch and process ALL nested sitemaps
          for (const sitemap of result.sitemapindex.sitemap) {
            const sitemapLoc = sitemap.loc[0];
            console.log(`🔍 Fetching nested sitemap: ${sitemapLoc}`);
            try {
              const nestedUrls = await fetchCustomSitemap(sitemapLoc, browser);
              urls.push(...nestedUrls);
            } catch (e) {
              console.log(`❌ Failed to fetch nested sitemap: ${sitemapLoc}`);
            }
          }
        }
        
        // Handle regular sitemap
        if (result.urlset && result.urlset.url) {
          console.log(`📄 Found ${result.urlset.url.length} URLs in sitemap`);
          // Process ALL URLs, no limits
          for (const url of result.urlset.url) {
            urls.push(url.loc[0]);
          }
        }
        
        if (urls.length === 0) {
          const baseUrl = new URL(sitemapUrl).origin;
          urls.push(baseUrl);
        }
        
        resolve(urls);
      });
    });
  } catch (error) {
    console.log(`⚠️ Error fetching sitemap: ${error.message}`);
    const baseUrl = new URL(sitemapUrl).origin;
    return [baseUrl];
  }
}

// Detect primary language of the website
function detectPrimaryLanguage(url) {
  const domain = new URL(url).hostname;
  const path = new URL(url).pathname;
  
  // Common language indicators in URLs
  const langPatterns = {
    'en': /\/(en|en-us|en-ca|en-gb|english)\//i,
    'fr': /\/(fr|fr-ca|fr-fr|francais|french)\//i,
    'es': /\/(es|es-mx|es-us|espanol|spanish)\//i,
    'de': /\/(de|de-de|deutsch|german)\//i,
    'it': /\/(it|it-it|italiano|italian)\//i,
    'pt': /\/(pt|pt-br|pt-pt|portugues|portuguese)\//i,
    'zh': /\/(zh|zh-cn|zh-tw|chinese)\//i,
    'ja': /\/(ja|jp|japanese)\//i,
    'ko': /\/(ko|kr|korean)\//i,
    'ar': /\/(ar|arabic)\//i,
    'ru': /\/(ru|russian)\//i,
    'nl': /\/(nl|dutch)\//i,
    'sv': /\/(sv|swedish)\//i,
    'da': /\/(da|danish)\//i,
    'no': /\/(no|norwegian)\//i,
    'fi': /\/(fi|finnish)\//i
  };
  
  // Check URL path for language indicators
  for (const [lang, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(path)) {
      return lang;
    }
  }
  
  // Default language detection from domain
  if (domain.endsWith('.fr') || domain.includes('france')) return 'fr';
  if (domain.endsWith('.de') || domain.includes('german')) return 'de';
  if (domain.endsWith('.es') || domain.includes('spain')) return 'es';
  if (domain.endsWith('.it') || domain.includes('ital')) return 'it';
  if (domain.endsWith('.ca')) {
    // For Canadian sites, check if there's any French content in the URL
    if (path.includes('fr')) return 'fr';
    // Check the domain for French brands/companies
    if (domain.includes('tampax') || domain.includes('always') || domain.includes('gillette')) {
      // These P&G brands often have French Canadian versions
      return 'fr';
    }
  }
  
  // Default to English
  return 'en';
}

// Detect language of text content
function detectTextLanguage(text) {
  if (!text || text.length < 3) return 'unknown';
  
  const cleanText = text.toLowerCase().trim();
  
  // English detection patterns
  const englishPatterns = [
    /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|above|below|up|down|out|off|over|under|again|further|then|once)\b/g,
    /\b(this|that|these|those|here|there|where|when|what|who|why|how|can|could|would|should|will|shall|may|might|must)\b/g,
    /\b(have|has|had|do|does|did|get|got|make|made|take|took|come|came|go|went|see|saw|know|knew|think|thought|say|said|work|worked)\b/g,
    /\b(good|great|best|better|new|old|first|last|long|short|high|low|right|wrong|big|small|large|little|important|different)\b/g,
    /\b(hello|thanks|thank you|please|yes|no|english|america|canada|australia|britain|england)\b/g
  ];
  
  // Other language patterns for comparison
  const languagePatterns = {
    'fr': [
      /\b(le|la|les|un|une|des|de|du|et|à|avec|pour|dans|sur|par|ce|cette|qui|que|où|comment|pourquoi|quand)\b/g,
      /\b(bonjour|merci|oui|non|français|france|très|plus|mais|tout|tous|être|avoir|faire|aller|voir|savoir)\b/g
    ],
    'es': [
      /\b(el|la|los|las|un|una|y|de|en|con|para|por|que|se|no|es|está|son|tienen)\b/g,
      /\b(hola|gracias|sí|español|españa|muy|más|pero|todo|todos|ser|estar|tener|hacer|ir|ver|saber)\b/g
    ],
    'de': [
      /\b(der|die|das|ein|eine|und|mit|für|von|zu|ist|sind|haben|werden|nicht)\b/g,
      /\b(hallo|danke|ja|nein|deutsch|deutschland|sehr|mehr|aber|alle|sein|haben|werden|machen|gehen|sehen|wissen)\b/g
    ],
    'it': [
      /\b(il|la|lo|gli|le|un|una|e|di|in|con|per|da|che|si|non|è|sono|hanno)\b/g,
      /\b(ciao|grazie|sì|italiano|italia|molto|più|ma|tutto|tutti|essere|avere|fare|andare|vedere|sapere)\b/g
    ],
    'pt': [
      /\b(o|a|os|as|um|uma|e|de|em|com|para|por|que|se|não|é|são|tem|português)\b/g,
      /\b(olá|obrigado|sim|portugal|brasil|muito|mais|mas|todo|todos|ser|estar|ter|fazer|ir|ver|saber)\b/g
    ]
  };
  
  // Count English matches
  let englishScore = 0;
  for (const pattern of englishPatterns) {
    const matches = cleanText.match(pattern);
    if (matches) {
      englishScore += matches.length;
    }
  }
  
  // Count other language matches
  let maxOtherScore = 0;
  let detectedOtherLang = '';
  
  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    let score = 0;
    for (const pattern of patterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }
    
    if (score > maxOtherScore) {
      maxOtherScore = score;
      detectedOtherLang = lang;
    }
  }
  
  // Determine language based on scores
  if (englishScore > maxOtherScore && englishScore > 2) {
    return 'en';
  } else if (maxOtherScore > 2) {
    return detectedOtherLang;
  }
  
  // Default fallback - check for common English words with lower threshold
  if (englishScore > 0) {
    return 'en';
  }
  
  return 'unknown';
}

// Extract accessibility data from a page
async function extractAccessibilityData(page, pageUrl) {
  console.log(`🔍 Analyzing: ${pageUrl}`);
  
  try {
    await page.goto(pageUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);
    
    // Detect the primary language of this page
    const primaryLanguage = detectPrimaryLanguage(pageUrl);
    console.log(`🌐 Primary language detected: ${primaryLanguage}`);
    
    // Extract all images, links, and interactive elements
    const data = await page.evaluate((params) => {
      // Inject the functions into page context
      const computeAccessibleName = new Function('element', params.computeAccessibleNameStr);
      const detectTextLanguage = new Function('text', params.detectTextLanguageStr);
      const primaryLang = params.primaryLang;
      
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
      
      // Helper function to check if content is English when site is not English
      function isEnglishContent(text) {
        if (!text || text.length < 3) return false;
        const detectedLang = detectTextLanguage(text);
        // Only flag as different if we detect English on a non-English site
        return detectedLang === 'en' && primaryLang !== 'en';
      }
      
      // Extract all images - only if content is in different language
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        const src = img.getAttribute('src');
        if (src) {
          const altText = img.getAttribute('alt') || '';
          const computedName = computeAccessibleName(img);
          const ariaLabel = img.getAttribute('aria-label') || '';
          
          // Check if any text content is English on non-English site
          const isAltEnglish = isEnglishContent(altText);
          const isNameEnglish = isEnglishContent(computedName);
          const isAriaLabelEnglish = isEnglishContent(ariaLabel);
          
          if (isAltEnglish || isNameEnglish || isAriaLabelEnglish) {
            results.push({
              type: 'image',
              elementId: `img_${index}`,
              pageUrl: window.location.href,
              imageLink: makeAbsolute(src),
              altText: altText,
              altLanguage: isAltEnglish ? 'en' : '',
              width: img.width || img.getAttribute('width') || '',
              height: img.height || img.getAttribute('height') || '',
              role: img.getAttribute('role') || '',
              ariaLabel: ariaLabel,
              ariaLabelLanguage: isAriaLabelEnglish ? 'en' : '',
              ariaLabelledby: img.getAttribute('aria-labelledby') || '',
              ariaDescribedby: img.getAttribute('aria-describedby') || '',
              computedName: computedName,
              computedNameLanguage: isNameEnglish ? 'en' : '',
              link: '',
              linkText: '',
              linkTextLanguage: '',
              linkTarget: '',
              linkRel: ''
            });
          }
        }
      });
      
      // Extract all links - only if content is in different language
      const links = document.querySelectorAll('a[href]');
      links.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (href) {
          const linkText = link.innerText.trim();
          const computedName = computeAccessibleName(link);
          const ariaLabel = link.getAttribute('aria-label') || '';
          
          // Check if any text content is English on non-English site
          const isTextEnglish = isEnglishContent(linkText);
          const isAriaLabelEnglish = isEnglishContent(ariaLabel);
          const isNameEnglish = isEnglishContent(computedName);
          
          if (isTextEnglish || isAriaLabelEnglish || isNameEnglish) {
            results.push({
              type: 'link',
              elementId: `link_${index}`,
              pageUrl: window.location.href,
              imageLink: '',
              altText: '',
              altLanguage: '',
              width: '',
              height: '',
              role: link.getAttribute('role') || '',
              ariaLabel: ariaLabel,
              ariaLabelLanguage: isAriaLabelEnglish ? 'en' : '',
              ariaLabelledby: link.getAttribute('aria-labelledby') || '',
              ariaDescribedby: link.getAttribute('aria-describedby') || '',
              computedName: computedName,
              computedNameLanguage: isNameEnglish ? 'en' : '',
              link: makeAbsolute(href),
              linkText: linkText,
              linkTextLanguage: isTextEnglish ? 'en' : '',
              linkTarget: link.getAttribute('target') || '',
              linkRel: link.getAttribute('rel') || ''
            });
          }
        }
      });
      
      // Extract interactive elements - only if content is in different language
      const interactiveSelectors = [
        'button',
        'input[type="submit"]',
        'input[type="button"]',
        'select',
        'textarea',
        '[role="button"]',
        '[role="link"]',
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
        
        const innerText = element.innerText ? element.innerText.trim().substring(0, 100) : '';
        const computedName = computeAccessibleName(element);
        const ariaLabel = element.getAttribute('aria-label') || '';
        const placeholder = element.getAttribute('placeholder') || '';
        const value = element.value || '';
        
        // Check if any text content is English on non-English site
        const isTextEnglish = isEnglishContent(innerText);
        const isAriaLabelEnglish = isEnglishContent(ariaLabel);
        const isNameEnglish = isEnglishContent(computedName);
        const isPlaceholderEnglish = isEnglishContent(placeholder);
        const isValueEnglish = isEnglishContent(value);
        
        if (isTextEnglish || isAriaLabelEnglish || isNameEnglish || isPlaceholderEnglish || isValueEnglish) {
          results.push({
            type: 'interactive',
            elementId: `interactive_${element.tagName.toLowerCase()}_${index}`,
            pageUrl: window.location.href,
            imageLink: '',
            altText: placeholder || value || '',
            altLanguage: isPlaceholderEnglish ? 'en' : (isValueEnglish ? 'en' : ''),
            width: '',
            height: '',
            role: element.getAttribute('role') || element.tagName.toLowerCase(),
            ariaLabel: ariaLabel,
            ariaLabelLanguage: isAriaLabelEnglish ? 'en' : '',
            ariaLabelledby: element.getAttribute('aria-labelledby') || '',
            ariaDescribedby: element.getAttribute('aria-describedby') || '',
            computedName: computedName,
            computedNameLanguage: isNameEnglish ? 'en' : '',
            link: '',
            linkText: innerText,
            linkTextLanguage: isTextEnglish ? 'en' : '',
            linkTarget: '',
            linkRel: ''
          });
        }
      });
      
      return results;
    }, {
      computeAccessibleNameStr: computeAccessibleName.toString(),
      detectTextLanguageStr: detectTextLanguage.toString(),
      primaryLang: primaryLanguage
    });
    
    console.log(`✅ Found ${data.length} accessibility elements on ${pageUrl}`);
    return data;
    
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.log(`⏱️ Page loading timeout: ${pageUrl}`);
    } else if (error.message.includes('net::')) {
      console.log(`🌐 Network error: ${pageUrl}`);
    } else {
      console.log(`❌ Error analyzing ${pageUrl}: ${error.message}`);
    }
    return [];
  }
}

// Generate Excel file with the specified columns
async function generateCustomExcelReport(allData, websiteName, primaryLanguage) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('English Content');
  
  // Define columns with language detection
  worksheet.columns = [
    { header: 'Page URL', key: 'pageUrl', width: 60 },
    { header: 'Element Type', key: 'type', width: 15 },
    { header: 'Image Link', key: 'imageLink', width: 60 },
    { header: 'Alt Text', key: 'altText', width: 40 },
    { header: 'Alt Language', key: 'altLanguage', width: 15 },
    { header: 'Link', key: 'link', width: 60 },
    { header: 'Link Text', key: 'linkText', width: 40 },
    { header: 'Link Text Language', key: 'linkTextLanguage', width: 15 },
    { header: 'ARIA Label', key: 'ariaLabel', width: 40 },
    { header: 'ARIA Label Language', key: 'ariaLabelLanguage', width: 15 },
    { header: 'Computed Name', key: 'computedName', width: 40 },
    { header: 'Computed Name Language', key: 'computedNameLanguage', width: 15 },
    { header: 'Role', key: 'role', width: 20 },
    { header: 'Element ID', key: 'elementId', width: 25 },
    { header: 'Primary Site Language', key: 'primaryLanguage', width: 15 }
  ];
  
  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  
  // Add borders to header
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data
  allData.forEach((item, index) => {
    const rowData = {
      ...item,
      primaryLanguage: primaryLanguage
    };
    const row = worksheet.addRow(rowData);
    
    // Add borders to data rows
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Alternate row colors
    if (index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8F9FA' }
      };
    }
  });
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    if (column.width < 20) column.width = 20;
    if (column.width > 80) column.width = 80;
  });
  
  // Save file
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `english-content-${websiteName}-${timestamp}.xlsx`;
  const filepath = `test-results/${filename}`;
  
  await workbook.xlsx.writeFile(filepath);
  console.log(`📊 English content report saved: ${filepath}`);
  
  return filepath;
}

// Main function for custom URL analysis
async function analyzeCustomWebsite(sitemapUrl) {
  console.log(`🚀 Starting English content detection from sitemap: ${sitemapUrl}`);
  console.log(`📅 Analysis Date: ${new Date().toLocaleString()}`);
  console.log('==================================================');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Get URLs from sitemap
    const urls = await fetchCustomSitemap(sitemapUrl, browser);
    console.log(`📋 Will analyze ${urls.length} pages for English content`);
    
    // Detect primary language from the first URL
    const sitePrimaryLanguage = detectPrimaryLanguage(sitemapUrl);
    console.log(`🌐 Website primary language: ${sitePrimaryLanguage.toUpperCase()}`);
    
    if (sitePrimaryLanguage === 'en') {
      console.log(`\n⚠️ This website appears to be primarily in English.`);
      console.log(`This tool is designed to find English content on non-English websites.`);
      console.log(`No analysis needed for English websites.`);
      return;
    }
    
    const allData = [];
    let processedPages = 0;
    
    // Analyze each page
    for (let i = 0; i < urls.length; i++) {
      const pageUrl = urls[i];
      console.log(`\n🔍 Progress: ${i + 1}/${urls.length}`);
      
      const pageData = await extractAccessibilityData(page, pageUrl);
      if (pageData.length > 0) {
        allData.push(...pageData);
        processedPages++;
        console.log(`✅ Found ${pageData.length} English content elements on ${pageUrl}`);
      } else {
        console.log(`ℹ️ No English content found on ${pageUrl}`);
      }
      
      // Add a small delay to be respectful to the server
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n✅ Analysis complete! Found ${allData.length} English content elements across ${processedPages} pages`);
    
    if (allData.length === 0) {
      console.log(`\n🎉 Excellent! No English content found on this ${sitePrimaryLanguage.toUpperCase()} website.`);
      console.log(`All content appears to be in the primary language: ${sitePrimaryLanguage.toUpperCase()}`);
      return;
    }
    
    // Generate Excel report
    const domain = new URL(sitemapUrl).hostname.replace('www.', '');
    const reportPath = await generateCustomExcelReport(allData, domain, sitePrimaryLanguage);
    
    // Summary by language - count English occurrences
    const englishCounts = {};
    allData.forEach(item => {
      ['altLanguage', 'linkTextLanguage', 'ariaLabelLanguage', 'computedNameLanguage'].forEach(langField => {
        if (item[langField] === 'en') {
          englishCounts[langField] = (englishCounts[langField] || 0) + 1;
        }
      });
    });
    
    console.log('\n📊 ENGLISH CONTENT ANALYSIS');
    console.log('=======================================');
    console.log(`Website: ${domain}`);
    console.log(`Primary language: ${sitePrimaryLanguage.toUpperCase()}`);
    console.log(`Pages analyzed: ${urls.length}`);
    console.log(`Pages with English content: ${processedPages}`);
    console.log(`Total English content elements: ${allData.length}`);
    
    if (Object.keys(englishCounts).length > 0) {
      console.log('\n📝 English content found in:');
      if (englishCounts.altLanguage) console.log(`  Alt text: ${englishCounts.altLanguage} elements`);
      if (englishCounts.linkTextLanguage) console.log(`  Link text: ${englishCounts.linkTextLanguage} elements`);
      if (englishCounts.ariaLabelLanguage) console.log(`  ARIA labels: ${englishCounts.ariaLabelLanguage} elements`);
      if (englishCounts.computedNameLanguage) console.log(`  Computed names: ${englishCounts.computedNameLanguage} elements`);
    }
    
    console.log(`\n📄 Detailed Report: ${reportPath}`);

  } catch (error) {
    console.log(`❌ Analysis failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

// CLI usage
const sitemapUrl = process.argv[2];

if (!sitemapUrl) {
  console.log('Usage: node custom-analyzer.js <sitemap-url>');
  console.log('\nExample: node custom-analyzer.js https://www.tampax.ca/sitemap.xml');
  console.log('\nThis tool analyzes non-English websites to find content that contains English text.');
  console.log('It helps identify mixed-language content that may need localization attention.');
  process.exit(1);
}

// Ensure directories exist
['test-results'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run the analysis
analyzeCustomWebsite(sitemapUrl);
