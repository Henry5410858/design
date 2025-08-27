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
  // Disable ESLint during build to generate complete artifacts
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
