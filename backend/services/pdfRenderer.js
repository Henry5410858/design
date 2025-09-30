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

async function renderTemplateToPdf({ template, data, locale = 'es', currencyCode = 'EUR', prefetch = true, retries = 2 }) {
  const templatePath = path.join(__dirname, '..', 'templates', `${template}.ejs`);

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
    await prefetchImages(urls);
  }

  const html = await ejs.renderFile(
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
          '--enable-automation'
        );
      }

      browser = await puppeteer.launch(launchOptions);
      console.log('[PDF] Browser launched successfully');

      const page = await browser.newPage();
      console.log('[PDF] Created new page');

      // Set viewport and wait conditions
      await page.setViewport({ width: 1200, height: 800 });

      console.log('[PDF] Setting page content...');
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      console.log('[PDF] Page content set successfully');

      // Wait a bit for any dynamic content to load
      await sleep(2000);

      console.log('[PDF] Generating PDF...');
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        timeout: 30000
      });
      console.log(`[PDF] PDF generated successfully: ${pdf.length} bytes`);

      await browser.close();
      return pdf;
    } catch (e) {
      console.error('[PDF] Error during PDF generation:', e);
      console.error('[PDF] Error name:', e.name);
      console.error('[PDF] Error message:', e.message);
      console.error('[PDF] Error stack:', e.stack);

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
      }

      throw new Error(`${errorMessage}: ${e.message}`);
    }
  };

  return await renderWithRetries(doRender, { retries });
}

module.exports = { renderTemplateToPdf };