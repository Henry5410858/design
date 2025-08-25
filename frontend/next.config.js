/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    includePaths: ['./src/styles'],
  },
  // Disable strict mode temporarily to avoid hydration issues
  reactStrictMode: false,
  // Ensure proper TypeScript handling
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
