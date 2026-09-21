// Enhanced Sitemap Parser with improved CORS handling and crawling fallback

// Multiple CORS proxies for redundancy
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

// Parse sitemap XML to extract URLs
const parseSitemap = (xmlContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  const urls = [];
  
  // Check for parsing errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    console.warn('XML parsing warning:', parseError.textContent);
  }
  
  // Handle regular sitemap
  const urlElements = xmlDoc.querySelectorAll('url > loc');
  urlElements.forEach(element => {
    const url = element.textContent?.trim();
    if (url && isValidUrl(url)) {
      urls.push({
        url: url,
        lastmod: getTextContent(element.parentElement, 'lastmod'),
        changefreq: getTextContent(element.parentElement, 'changefreq'),
        priority: getTextContent(element.parentElement, 'priority')
      });
    }
  });
  
  // Also try regex-based extraction for malformed XML
  if (urls.length === 0) {
    const locMatches = xmlContent.match(/<loc[^>]*>([^<]+)<\/loc>/gi);
    if (locMatches) {
      locMatches.forEach(match => {
        const url = match.replace(/<\/?loc[^>]*>/gi, '').trim();
        if (isValidUrl(url)) {
          urls.push({ url, lastmod: null, changefreq: null, priority: null });
        }
      });
    }
  }
  
  // Handle sitemap index
  const sitemapElements = xmlDoc.querySelectorAll('sitemap > loc');
  const sitemapUrls = [];
  sitemapElements.forEach(element => {
    const url = element.textContent?.trim();
    if (url && isValidUrl(url)) {
      sitemapUrls.push(url);
    }
  });
  
  // Also try regex for sitemap index
  if (sitemapUrls.length === 0 && xmlContent.includes('<sitemapindex')) {
    const sitemapLocMatches = xmlContent.match(/<sitemap[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>/gi);
    if (sitemapLocMatches) {
      sitemapLocMatches.forEach(match => {
        const locMatch = match.match(/<loc>([^<]+)<\/loc>/i);
        if (locMatch && isValidUrl(locMatch[1].trim())) {
          sitemapUrls.push(locMatch[1].trim());
        }
      });
    }
  }
  
  return { urls, sitemapUrls };
};

// Helper function to get text content from XML element
const getTextContent = (parent, tagName) => {
  const element = parent?.querySelector(tagName);
  return element ? element.textContent?.trim() : null;
};

// Validate URL
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Enhanced fetch with multiple CORS proxy fallbacks
const fetchWithCorsProxies = async (url, options = {}) => {
  const { timeout = 8000 } = options;
  
  // Create abort controller for timeout
  const createFetchWithTimeout = (fetchUrl, fetchOptions = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    return fetch(fetchUrl, {
      ...fetchOptions,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));
  };
  
  // Strategy 1: Direct fetch
  try {
    const response = await createFetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, text/html, */*',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      mode: 'cors',
      cache: 'no-store'
    });
    
    if (response.ok) {
      return await response.text();
    }
    
    // If we get a specific error, try proxies
    if (response.status === 403 || response.status === 401) {
      throw new Error(`HTTP ${response.status}: Access denied`);
    }
    
    throw new Error(`HTTP ${response.status}`);
  } catch (directError) {
    console.log(`Direct fetch failed for ${url}:`, directError.message);
  }
  
  // Strategy 2: Try CORS proxies
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](url);
    
    try {
      const response = await createFetchWithTimeout(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, application/xml, text/xml, text/html, */*'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Handle different proxy response formats
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const data = await response.json();
        // allorigins and similar proxies return { contents: "..." }
        if (data.contents) {
          return data.contents;
        }
        // Some proxies return the content directly as a string in JSON
        if (typeof data === 'string') {
          return data;
        }
        throw new Error('Unexpected JSON response format');
      }
      
      return await response.text();
      
    } catch (proxyError) {
      console.log(`Proxy ${i + 1} failed for ${url}:`, proxyError.message);
      continue;
    }
  }
  
  throw new Error(`All fetch strategies failed for ${url}`);
};

// Crawl website to discover URLs when sitemap is not available
const crawlForUrls = async (baseUrl, maxUrls = 20, onProgress = null) => {
  const domain = new URL(baseUrl).origin;
  const discovered = new Set();
  const toVisit = [baseUrl];
  const visited = new Set();
  
  if (onProgress) onProgress('Crawling website for URLs...');
  
  while (toVisit.length > 0 && discovered.size < maxUrls) {
    const currentUrl = toVisit.shift();
    
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);
    
    try {
      if (onProgress) onProgress(`Crawling: ${currentUrl.substring(0, 50)}...`);
      
      let html;
      try {
        html = await fetchWithCorsProxies(currentUrl, { timeout: 5000 });
      } catch {
        continue;
      }
      
      // Add current URL to discovered
      discovered.add({ url: currentUrl, lastmod: null, changefreq: null, priority: null });
      
      // Extract links from HTML
      const linkPattern = /href=["']([^"'#]+)["']/gi;
      let match;
      
      while ((match = linkPattern.exec(html)) !== null && discovered.size < maxUrls) {
        let href = match[1].trim();
        const normalizedHref = href.toLowerCase();
        
        // Skip non-page links
        // eslint-disable-next-line no-script-url
        if (normalizedHref.startsWith('javascript:') || 
            normalizedHref.startsWith('mailto:') || 
            normalizedHref.startsWith('tel:') ||
            normalizedHref.startsWith('#') ||
            normalizedHref.endsWith('.pdf') ||
            normalizedHref.endsWith('.jpg') ||
            normalizedHref.endsWith('.png') ||
            normalizedHref.endsWith('.gif') ||
            normalizedHref.endsWith('.css') ||
            normalizedHref.endsWith('.js')) {
          continue;
        }
        
        // Make relative URLs absolute
        if (href.startsWith('/')) {
          href = domain + href;
        } else if (!href.startsWith('http')) {
          continue;
        }
        
        // Only include same-domain URLs
        try {
          const urlObj = new URL(href);
          if (urlObj.origin !== domain) continue;
          
          // Clean URL (remove query params for deduplication)
          const cleanUrl = `${urlObj.origin}${urlObj.pathname}`;
          
          if (!visited.has(cleanUrl) && !toVisit.includes(cleanUrl)) {
            toVisit.push(cleanUrl);
          }
        } catch {
          continue;
        }
      }
      
    } catch (error) {
      console.warn(`Failed to crawl ${currentUrl}:`, error.message);
    }
    
    // Minimal delay for speed
    await new Promise(r => setTimeout(r, 50));
  }
  
  return Array.from(discovered);
};

// Discover sitemap URLs from multiple sources
export const discoverSitemaps = async (baseUrl, onProgress = null) => {
  const sitemapUrls = [];
  const domain = new URL(baseUrl).origin;
  
  // Common sitemap locations
  const commonPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap1.xml',
    '/sitemaps.xml',
    '/wp-sitemap.xml',
    '/sitemap/sitemap.xml',
    '/page-sitemap.xml',
    '/post-sitemap.xml',
    '/news-sitemap.xml'
  ];
  
  if (onProgress) onProgress('Checking robots.txt for sitemaps...');
  
  // Try robots.txt first
  try {
    const robotsContent = await fetchWithCorsProxies(`${domain}/robots.txt`, { timeout: 5000 });
    const sitemapMatches = robotsContent.match(/Sitemap:\s*(.+)/gi);
    
    if (sitemapMatches) {
      sitemapMatches.forEach(match => {
        const url = match.replace(/Sitemap:\s*/i, '').trim();
        if (isValidUrl(url) && !sitemapUrls.includes(url)) {
          console.log('Found sitemap in robots.txt:', url);
          sitemapUrls.push(url);
        }
      });
    }
  } catch (error) {
    console.log('Could not fetch robots.txt:', error.message);
  }
  
  if (onProgress) onProgress('Checking common sitemap locations...');
  
  // Try common paths
  for (const path of commonPaths) {
    const url = `${domain}${path}`;
    
    // Skip if already found
    if (sitemapUrls.includes(url)) continue;
    
    try {
      const content = await fetchWithCorsProxies(url, { timeout: 5000 });
      
      // Verify it's actually XML/sitemap content
      if (content && (content.includes('<?xml') || content.includes('<urlset') || content.includes('<sitemapindex'))) {
        console.log('Found sitemap at:', url);
        sitemapUrls.push(url);
        break; // Found one, no need to check more common paths
      }
    } catch (error) {
      // Ignore errors for common paths - they may not exist
    }
  }
  
  // Try to find sitemap links in HTML
  if (sitemapUrls.length === 0) {
    if (onProgress) onProgress('Searching website for sitemap links...');
    
    try {
      const htmlContent = await fetchWithCorsProxies(baseUrl, { timeout: 5000 });
      
      // Look for sitemap links in HTML
      const patterns = [
        /href=["']([^"']*sitemap[^"']*\.xml[^"']*)["']/gi,
        /https?:\/\/[^\s<>"']+sitemap[^\s<>"']*\.xml/gi
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(htmlContent)) !== null) {
          let sitemapUrl = (match[1] || match[0]).trim();
          
          // Make relative URLs absolute
          if (sitemapUrl.startsWith('/')) {
            sitemapUrl = domain + sitemapUrl;
          }
          
          if (isValidUrl(sitemapUrl) && !sitemapUrls.includes(sitemapUrl)) {
            console.log('Found sitemap link in HTML:', sitemapUrl);
            sitemapUrls.push(sitemapUrl);
          }
        }
      });
    } catch (error) {
      console.log('Could not search HTML for sitemaps:', error.message);
    }
  }
  
  return [...new Set(sitemapUrls)]; // Remove duplicates
};

// Extract all URLs from website sitemaps or crawl as fallback
export const extractSitemapUrls = async (baseUrl, onProgress = null) => {
  if (onProgress) onProgress('Discovering sitemaps...');
  
  let sitemapUrls = [];
  let allUrls = [];
  let usedCrawling = false;
  
  try {
    sitemapUrls = await discoverSitemaps(baseUrl, onProgress);
  } catch (error) {
    console.warn('Sitemap discovery failed:', error.message);
  }
  
  if (sitemapUrls.length === 0) {
    // No sitemaps found - fall back to crawling
    console.log('No sitemaps found, falling back to website crawling...');
    if (onProgress) onProgress('No sitemaps found. Crawling website for URLs...');
    
    usedCrawling = true;
    allUrls = await crawlForUrls(baseUrl, 15, onProgress);
    
    if (allUrls.length === 0) {
      // Even crawling failed - return just the base URL
      console.log('Crawling found no URLs, using base URL only');
      allUrls = [{ url: baseUrl, lastmod: null, changefreq: null, priority: null }];
    }
    
  } else {
    console.log(`Found ${sitemapUrls.length} sitemap(s):`, sitemapUrls);
    if (onProgress) onProgress(`Found ${sitemapUrls.length} sitemap(s), parsing...`);
    
    const processedSitemaps = new Set();
    
    // Process each discovered sitemap
    for (const sitemapUrl of sitemapUrls) {
      if (processedSitemaps.has(sitemapUrl)) continue;
      processedSitemaps.add(sitemapUrl);
      
      try {
        if (onProgress) onProgress(`Parsing sitemap: ${sitemapUrl}`);
        
        const xmlContent = await fetchWithCorsProxies(sitemapUrl, { timeout: 8000 });
        const { urls, sitemapUrls: nestedSitemaps } = parseSitemap(xmlContent);
        
        console.log(`Extracted ${urls.length} URLs from ${sitemapUrl}`);
        allUrls.push(...urls);
        
        // Process nested sitemaps (sitemap index files) - limit to first 5
        const nestedToProcess = nestedSitemaps.slice(0, 5);
        
        for (const nestedUrl of nestedToProcess) {
          if (processedSitemaps.has(nestedUrl)) continue;
          processedSitemaps.add(nestedUrl);
          
          try {
            if (onProgress) onProgress(`Parsing nested sitemap: ${nestedUrl}`);
            const nestedXml = await fetchWithCorsProxies(nestedUrl, { timeout: 8000 });
            const { urls: nestedUrls } = parseSitemap(nestedXml);
            console.log(`Extracted ${nestedUrls.length} URLs from nested sitemap`);
            allUrls.push(...nestedUrls);
          } catch (nestedError) {
            console.warn(`Failed to parse nested sitemap ${nestedUrl}:`, nestedError.message);
            // Continue with other sitemaps instead of failing completely
          }
        }
      } catch (error) {
        console.warn(`Failed to parse sitemap ${sitemapUrl}:`, error.message);
        // Continue with other sitemaps or fall back to crawling
      }
    }
    
    // If sitemap parsing got no URLs, try crawling
    if (allUrls.length === 0) {
      console.log('Sitemap parsing returned no URLs, falling back to crawling...');
      if (onProgress) onProgress('Sitemap parsing failed. Crawling website...');
      
      usedCrawling = true;
      allUrls = await crawlForUrls(baseUrl, 15, onProgress);
    }
  }
  
  // Final fallback - use base URL
  if (allUrls.length === 0) {
    console.log('No URLs found, using base URL only');
    allUrls = [{ url: baseUrl, lastmod: null, changefreq: null, priority: null }];
  }
  
  // Remove duplicates and filter valid URLs
  const baseUrlObj = new URL(baseUrl);
  const uniqueUrls = allUrls
    .filter((urlObj, index, self) => 
      index === self.findIndex(u => u.url === urlObj.url)
    )
    .filter(urlObj => {
      try {
        const url = new URL(urlObj.url);
        return url.hostname === baseUrlObj.hostname;
      } catch {
        return false;
      }
    });
  
  console.log(`Final result: ${uniqueUrls.length} unique URLs ready for scanning${usedCrawling ? ' (via crawling)' : ''}`);
  
  if (onProgress) {
    onProgress(`Found ${uniqueUrls.length} unique URLs${usedCrawling ? ' via crawling' : ''}`);
  }
  
  return uniqueUrls;
};

// Also export individual functions for testing
export { parseSitemap, fetchWithCorsProxies, crawlForUrls, isValidUrl };
