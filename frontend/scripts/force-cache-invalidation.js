#!/usr/bin/env node

/**
 * Force cache invalidation script
 * This script modifies files to force browser cache invalidation
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Starting cache invalidation process...');

// Update service worker version
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8');
  const timestamp = Date.now();
  
  // Update cache names with timestamp
  swContent = swContent.replace(
    /const CACHE_NAME = '[^']+';/,
    `const CACHE_NAME = 'diseñopro-v${timestamp}';`
  );
  swContent = swContent.replace(
    /const STATIC_CACHE = '[^']+';/,
    `const STATIC_CACHE = 'diseñopro-static-v${timestamp}';`
  );
  swContent = swContent.replace(
    /const DYNAMIC_CACHE = '[^']+';/,
    `const DYNAMIC_CACHE = 'diseñopro-dynamic-v${timestamp}';`
  );
  
  fs.writeFileSync(swPath, swContent);
  console.log('✅ Service Worker cache version updated');
}

// Add cache-busting query parameter to manifest
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = Date.now().toString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Manifest version updated');
}

console.log('🎉 Cache invalidation completed!');