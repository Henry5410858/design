const cloudinary = require('../config/cloudinary');

/**
 * Build a Cloudinary fetch URL for any remote image with sensible optimizations.
 * - Automatic format and quality
 * - Optional resizing and cropping
 */
function cldFetch(url, opts = {}) {
  if (!url) return '';
  const {
    width,
    height,
    crop = 'fill',
    gravity = 'auto',
    fetch_format = 'auto',
    quality = 'auto',
    dpr = 'auto',
    background,
    radius,
  } = opts;

  const parts = [];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (crop) parts.push(`c_${crop}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (radius) parts.push(`r_${radius}`);
  if (background) parts.push(`b_${background}`);
  if (dpr) parts.push(`dpr_${dpr}`);
  if (fetch_format) parts.push(`f_${fetch_format}`);
  if (quality) parts.push(`q_${quality}`);

  const transformation = parts.join(',');

  // Use Cloudinary image fetch
  const cloudName = cloudinary.config().cloud_name;
  const base = `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/`;
  // URL-encode the remote URL
  return base + encodeURIComponent(url);
}

/**
 * Upload a PDF buffer to Cloudinary as a raw asset.
 * Returns Cloudinary upload result with secure_url and public_id.
 */
function uploadPdf(buffer, { folder = 'proposals', publicId } = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      resource_type: 'raw',
      folder,
      format: 'pdf',
      overwrite: true,
    };
    if (publicId) options.public_id = publicId;

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = { cldFetch, uploadPdf };