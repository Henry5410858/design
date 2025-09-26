const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const { cldFetch } = require('./cloudinaryHelpers');

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
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      });
      await browser.close();
      return pdf;
    } catch (e) {
      if (browser) {
        try { await browser.close(); } catch (_) {}
      }
      throw e;
    }
  };

  return await renderWithRetries(doRender, { retries });
}

module.exports = { renderTemplateToPdf };