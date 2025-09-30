const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const { cldFetch } = require('./cloudinaryHelpers');
const os = require('os');

function currency(amount, currencyCode = 'EUR') {
  try {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

function t(key, fallback) {
  // Basic passthrough for now; integrate i18n later
  return fallback || key;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function prefetchImages(urls, { timeoutMs = 8000 } = {}) {
  const unique = Array.from(new Set((urls || []).filter(Boolean)));
  await Promise.all(
    unique.map(async (url) => {
      try {
        // We GET to warm Cloudinary fetch cache; ignore response body
        const ctrl = new AbortController();
        const id = setTimeout(() => ctrl.abort(), timeoutMs);
        await fetch(url, { method: 'GET', signal: ctrl.signal });
        clearTimeout(id);
      } catch (_) {
        // ignore prefetch errors; rendering may still succeed
      }
    })
  );
}

async function renderWithRetries(renderFn, { retries = 2, backoffMs = 600 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await renderFn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      await sleep(backoffMs * attempt);
    }
  }
}

// Simple HTML to PDF fallback using basic HTML structure
async function createSimpleHtmlPdf(data) {
  const { client, items = [], intro = '' } = data;
  
  const simpleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proposal - ${client.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .client-info { margin-bottom: 20px; }
        .item { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .item h3 { color: #333; }
        .price { font-weight: bold; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Propuesta Comercial</h1>
        <h2>${client.name}</h2>
      </div>
      
      <div class="client-info">
        <p><strong>Cliente:</strong> ${client.name}</p>
        ${client.industry ? `<p><strong>Sector:</strong> ${client.industry}</p>` : ''}
        ${client.contact?.email ? `<p><strong>Email:</strong> ${client.contact.email}</p>` : ''}
      </div>
      
      ${intro ? `<div class="intro"><p>${intro}</p></div>` : ''}
      
      <div class="items">
        <h3>Servicios Propuestos:</h3>
        ${items.map((item, index) => `
          <div class="item">
            <h3>${index + 1}. ${item.title || 'Servicio'}</h3>
            ${item.description ? `<p>${item.description}</p>` : ''}
            ${item.price ? `<p class="price">Precio: €${item.price}</p>` : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="footer" style="margin-top: 30px; text-align: center; color: #666;">
        <p>Propuesta generada el ${new Date().toLocaleDateString('es-ES')}</p>
      </div>
    </body>
    </html>
  `;
  
  return simpleHtml;
}

async function renderTemplateToPdf({ template, data, locale = 'es', currencyCode = 'EUR', prefetch = true, retries = 2 }) {
  console.log(`[PDF] Starting PDF generation for template: ${template}`);
  console.log(`[PDF] Data keys:`, Object.keys(data || {}));
  console.log(`[PDF] Options:`, { locale, currencyCode, prefetch, retries });
  
  // Add comprehensive error handling wrapper
  try {
  
  const templatePath = path.join(__dirname, '..', 'templates', `${template}.ejs`);
  console.log(`[PDF] Template path: ${templatePath}`);
  
  // Check if template file exists
  const fs = require('fs');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  // Preprocess data for Cloudinary images
  const theme = data.theme || {};
  const logoTransformed = theme.logoUrl ? cldFetch(theme.logoUrl, { width: 320, height: 120, crop: 'fit' }) : '';

  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    // Split by newline or comma
    return String(val)
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const items = (data.items || []).map((it) => ({
    ...it,
    keyFacts: toArray(it.keyFacts),
    benefits: toArray(it.benefits),
    performance: toArray(it.performance),
    highlights: toArray(it.highlights),
    _thumb: cldFetch(it.enhancedUrl || it.imageUrl, { width: 640, height: 360, crop: 'fill', gravity: 'auto' }),
    _hero: cldFetch(it.enhancedUrl || it.imageUrl, { width: 1200, height: 640, crop: 'fill', gravity: 'auto' }),
  }));

  // Prefetch images to warm Cloudinary cache and reduce navigation stalls
  if (prefetch) {
    const urls = [logoTransformed, ...items.map((i) => i._thumb), ...items.map((i) => i._hero)];
    console.log(`[PDF] Prefetching ${urls.length} images...`);
    await prefetchImages(urls);
    console.log(`[PDF] Image prefetching completed`);
  }

  console.log(`[PDF] Rendering EJS template...`);
  let html;
  try {
    html = await ejs.renderFile(
      templatePath,
      {
        ...data,
        theme,
        items,
        locale,
        currencyCode,
        logoTransformed,
        t,
        currency,
      },
      { async: true }
    );
    console.log(`[PDF] EJS template rendered successfully, HTML length: ${html.length}`);
  } catch (ejsError) {
    console.error(`[PDF] EJS rendering failed:`, ejsError);
    throw new Error(`Template rendering failed: ${ejsError.message}`);
  }

  const doRender = async () => {
    let browser;
    try {
      console.log('[PDF] Launching Puppeteer browser...');
      console.log('[PDF] Node version:', process.version);
      console.log('[PDF] Platform:', process.platform);
      console.log('[PDF] Architecture:', process.arch);
      console.log('[PDF] Memory:', process.memoryUsage());

      // Try different launch strategies for serverless environments
      let launchOptions = {
        headless: true,
        timeout: 60000,
        ignoreHTTPSErrors: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--memory-pressure-off',
          '--max_old_space_size=4096',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          // Increase shared memory
          '--disable-dev-shm-usage',
          // Font rendering
          '--font-render-hinting=none',
          // Memory optimization
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ]
      };

      // Check if running on Render (common serverless indicators)
      const isServerless = process.env.RENDER || process.env.VERCEL || process.env.NETLIFY || !process.env.HOME;
      if (isServerless) {
        console.log('[PDF] Detected serverless environment, using optimized config');
        launchOptions.args.push(
          '--single-process',
          '--no-zygote',
          '--disable-background-networking',
          '--disable-client-side-phishing-detection',
          '--disable-component-extensions-with-background-pages',
          '--disable-hang-monitor',
          '--disable-prompt-on-repost',
          '--force-color-profile=srgb',
          '--enable-automation',
          '--disable-extensions',
          '--disable-plugins',
          '--virtual-time-budget=30000'
        );
        
        // Increase timeout for serverless
        launchOptions.timeout = 120000; // 2 minutes
      }

      // Try to find Chrome executable on various platforms
      if (process.env.RENDER || process.env.VERCEL || process.env.NETLIFY || isServerless) {
        console.log('[PDF] Running on serverless platform, attempting to find Chrome...');
        
        // Check for environment variable first (set by Dockerfile)
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
          console.log(`[PDF] Using PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
          launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        } else {
          const possiblePaths = [
            // Standard Linux Chrome installations
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/opt/google/chrome/chrome',
            '/snap/bin/chromium',
            '/usr/bin/google-chrome-unstable',
            // Render.com specific paths
            '/opt/render/project/src/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome',
            '/opt/render/project/src/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux64/chrome',
            '/opt/render/project/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome',
            '/opt/render/project/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux64/chrome',
            // Additional Render paths
            '/usr/local/bin/chrome',
            '/usr/local/bin/chromium',
            '/usr/local/bin/google-chrome',
            // Heroku buildpack paths
            '/app/.chrome-for-testing/chrome-linux64/chrome',
            '/app/.apt/usr/bin/google-chrome',
            // macOS paths
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            // Windows paths
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
          ];
        
        for (const chromePath of possiblePaths) {
          try {
            const fs = require('fs');
            const path = require('path');
            
            // Handle glob patterns for Puppeteer's local Chromium
            if (chromePath.includes('*')) {
              try {
                const glob = require('glob');
                const matches = glob.sync(chromePath);
                if (matches.length > 0 && fs.existsSync(matches[0])) {
                  console.log(`[PDF] Found Chrome via glob at: ${matches[0]}`);
                  launchOptions.executablePath = matches[0];
                  break;
                }
              } catch (globError) {
                // Glob not available, skip glob patterns
                console.log('[PDF] Glob not available, skipping pattern:', chromePath);
              }
            } else if (fs.existsSync(chromePath)) {
              console.log(`[PDF] Found Chrome at: ${chromePath}`);
              launchOptions.executablePath = chromePath;
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }
        
        // If no Chrome found, try to use bundled Chromium
        if (!launchOptions.executablePath) {
          console.log('[PDF] No Chrome found, attempting to use bundled Chromium...');
          try {
            // Try to get Puppeteer's bundled Chromium path
            const puppeteerExecutablePath = puppeteer.executablePath();
            if (puppeteerExecutablePath) {
              const fs = require('fs');
              if (fs.existsSync(puppeteerExecutablePath)) {
                launchOptions.executablePath = puppeteerExecutablePath;
                console.log(`[PDF] Using Puppeteer bundled Chromium at: ${launchOptions.executablePath}`);
              }
            }
          } catch (e) {
            console.log('[PDF] Could not find bundled Chromium:', e.message);
          }
        }
        
        // Final fallback: try to install Chromium if not found
        if (!launchOptions.executablePath) {
          console.log('[PDF] No Chrome executable found, attempting to use default (may trigger Chromium download)');
          // Try to force Puppeteer to download Chromium if needed
          try {
            const puppeteerExecutablePath = puppeteer.executablePath();
            console.log('[PDF] Puppeteer default executable path:', puppeteerExecutablePath);
            
            // Verify the path exists
            const fs = require('fs');
            if (fs.existsSync(puppeteerExecutablePath)) {
              launchOptions.executablePath = puppeteerExecutablePath;
              console.log('[PDF] Using verified Puppeteer executable');
            } else {
              console.log('[PDF] Puppeteer executable path does not exist, will try without executablePath');
            }
          } catch (e) {
            console.log('[PDF] Could not get Puppeteer executable path:', e.message);
            // Don't set executablePath, let Puppeteer handle it
          }
        }
        
        // Log final configuration
        console.log('[PDF] Final Chrome configuration:', {
          executablePath: launchOptions.executablePath || 'default',
          hasExecutable: !!launchOptions.executablePath,
          platform: os.platform(),
          arch: os.arch(),
          isRender: !!process.env.RENDER,
          isVercel: !!process.env.VERCEL,
          isNetlify: !!process.env.NETLIFY
        });
      } // Close the serverless if block

      console.log('[PDF] Attempting to launch browser with options:', {
        headless: launchOptions.headless,
        executablePath: launchOptions.executablePath || 'default',
        argsCount: launchOptions.args.length,
        timeout: launchOptions.timeout
      });
      
      try {
        browser = await puppeteer.launch(launchOptions);
        console.log('[PDF] Browser launched successfully');
      } catch (launchError) {
        console.error('[PDF] Browser launch failed:', launchError);
        console.error('[PDF] Launch error stack:', launchError.stack);
        
        // Try with minimal options as fallback
        console.log('[PDF] Attempting browser launch with minimal options...');
        const minimalOptions = {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          timeout: 60000
        };
        
        try {
          browser = await puppeteer.launch(minimalOptions);
          console.log('[PDF] Browser launched with minimal options');
        } catch (minimalError) {
          console.error('[PDF] Minimal browser launch also failed:', minimalError);
          console.error('[PDF] Minimal error stack:', minimalError.stack);
          
          // Try ultra-minimal options
          console.log('[PDF] Attempting ultra-minimal browser launch...');
          const ultraMinimalOptions = {
            headless: true,
            args: ['--no-sandbox'],
            timeout: 90000
          };
          
          try {
            browser = await puppeteer.launch(ultraMinimalOptions);
            console.log('[PDF] Browser launched with ultra-minimal options');
          } catch (ultraMinimalError) {
            console.error('[PDF] Ultra-minimal browser launch also failed:', ultraMinimalError);
            console.error('[PDF] Ultra-minimal error stack:', ultraMinimalError.stack);
            throw new Error(`All browser launch attempts failed. Primary: ${launchError.message}. Minimal: ${minimalError.message}. Ultra-minimal: ${ultraMinimalError.message}`);
          }
        }
      }
      
      // Log browser version for debugging
      const version = await browser.version();
      console.log('[PDF] Browser version:', version);

      const page = await browser.newPage();
      console.log('[PDF] Created new page');

      // Set viewport and wait conditions
      await page.setViewport({ width: 1200, height: 800 });

      console.log('[PDF] Setting page content...');
      
      // Try different wait strategies based on environment
      const waitStrategy = isServerless ? 'domcontentloaded' : 'networkidle0';
      const contentTimeout = isServerless ? 60000 : 30000;
      
      await page.setContent(html, {
        waitUntil: waitStrategy,
        timeout: contentTimeout
      });
      console.log('[PDF] Page content set successfully');

      // Wait for content to stabilize
      const stabilizeTime = isServerless ? 5000 : 2000;
      await sleep(stabilizeTime);

      console.log('[PDF] Generating PDF...');
      const pdfTimeout = isServerless ? 60000 : 30000;
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        timeout: pdfTimeout,
        preferCSSPageSize: false
      });
      console.log(`[PDF] PDF generated successfully: ${pdf.length} bytes`);

      await browser.close();
      return pdf;
    }
    } catch (e) {
      console.error('[PDF] Error during PDF generation:', e);
      console.error('[PDF] Error name:', e.name);
      console.error('[PDF] Error message:', e.message);
      console.error('[PDF] Error stack:', e.stack);
      console.error('[PDF] Environment info:', {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        isServerless: isServerless,
        hasExecutablePath: !!launchOptions.executablePath,
        executablePath: launchOptions.executablePath || 'default'
      });

      if (browser) {
        try {
          console.log('[PDF] Closing browser after error...');
          await browser.close();
        } catch (closeError) {
          console.error('[PDF] Error closing browser:', closeError);
        }
      }

      // Provide more specific error messages
      let errorMessage = 'PDF generation failed';
      if (e.message.includes('Navigation timeout')) {
        errorMessage = 'PDF generation timed out while loading content';
      } else if (e.message.includes('net::ERR_CONNECTION')) {
        errorMessage = 'PDF generation failed due to network issues';
      } else if (e.message.includes('Browser has been closed')) {
        errorMessage = 'PDF generation failed: browser crashed or was closed';
      } else if (e.message.includes('Target closed')) {
        errorMessage = 'PDF generation failed: browser page was closed unexpectedly';
      } else if (e.message.includes('Failed to launch')) {
        errorMessage = 'PDF generation failed: could not launch browser (Chrome/Chromium not found or not executable)';
      } else if (e.message.includes('Protocol error')) {
        errorMessage = 'PDF generation failed: browser communication error';
      } else if (e.message.includes('ENOENT') || e.message.includes('spawn')) {
        errorMessage = 'PDF generation failed: Chrome/Chromium executable not found or not accessible';
      } else if (e.message.includes('Could not find Chromium')) {
        errorMessage = 'PDF generation failed: Chromium not installed or not found';
      }

      throw new Error(`${errorMessage}: ${e.message}`);
    }
  };

  // Try main render with retries
  try {
    return await renderWithRetries(doRender, { retries });
  } catch (mainError) {
    console.error('[PDF] Main render failed, attempting simple HTML fallback:', mainError);
    
    // Last resort: use simple HTML with minimal Puppeteer options
    try {
      const simpleHtml = await createSimpleHtmlPdf(data);
      
      const simpleFallback = async () => {
        let browser;
        try {
          console.log('[PDF] Launching browser for simple fallback...');
          browser = await puppeteer.launch({
            headless: true,
            timeout: 30000,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
          });
          
          const page = await browser.newPage();
          await page.setContent(simpleHtml, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await sleep(1000); // Brief stabilization
          
          const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
          });
          
          await browser.close();
          console.log(`[PDF] Simple fallback successful: ${pdf.length} bytes`);
          return pdf;
        } catch (e) {
          if (browser) {
            try { await browser.close(); } catch {}
          }
          throw e;
        }
      };
      
      return await simpleFallback();
    } catch (fallbackError) {
      console.error('[PDF] Simple fallback also failed:', fallbackError);
      throw new Error(`All PDF generation methods failed. Main: ${mainError.message}. Fallback: ${fallbackError.message}`);
    }
  }
  
  } catch (criticalError) {
    console.error('[PDF] Critical error in PDF generation:', criticalError);
    console.error('[PDF] Stack trace:', criticalError.stack);
    
    // Try one final ultra-simple fallback
    try {
      console.log('[PDF] Attempting final emergency fallback...');
      const emergencyHtml = createSimpleHtml(data);
      
      let browser;
      try {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox'],
          timeout: 15000
        });
        
        const page = await browser.newPage();
        await page.setContent(emergencyHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true
        });
        
        await browser.close();
        console.log(`[PDF] Emergency fallback successful: ${pdf.length} bytes`);
        return pdf;
      } catch (emergencyError) {
        if (browser) {
          try { await browser.close(); } catch {}
        }
        throw emergencyError;
      }
    } catch (emergencyError) {
      console.error('[PDF] Emergency fallback also failed:', emergencyError);
      throw new Error(`Complete PDF generation failure. Critical: ${criticalError.message}. Emergency: ${emergencyError.message}`);
    }
  }
}

module.exports = { renderTemplateToPdf };