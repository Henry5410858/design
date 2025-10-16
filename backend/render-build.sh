#!/bin/bash

echo "🚀 Starting Render backend build..."
echo "📦 Current environment:"
echo "  Node: $(node --version)"
echo "  NPM: $(npm --version)"
echo "  Platform: $(uname -s)"

# Update package list
echo "📥 Updating system packages..."
apt-get update

# Install system dependencies for native modules
echo "🔧 Installing build dependencies..."
apt-get install -y \
  build-essential \
  python3 \
  git \
  ca-certificates \
  libfontconfig1

# Install Chrome/Chromium for Puppeteer
echo "🌐 Installing Chromium (for PDF generation)..."
apt-get install -y chromium-browser

# Install additional image processing libraries
echo "🎨 Installing image processing libraries..."
apt-get install -y \
  libcairo2 \
  libcairo2-dev \
  libpango1.0 \
  libpango1.0-dev \
  libgif7 \
  libgif-dev \
  libjpeg-dev \
  libpixman-1 \
  libpixman-1-dev

# Clean up apt cache to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

# Install Node dependencies
echo "📦 Installing Node packages..."
npm install

# Build the application
echo "🔨 Running build script..."
npm run build

echo "✅ Build completed successfully!"