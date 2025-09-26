const cors = require('cors');

// Centralized CORS configuration with dynamic/dev-friendly origin handling
// This fixes login/API failures caused by an overly strict whitelist.

const staticOrigins = [
  'https://turbo-enigma-frontend.vercel.app',
  'https://turbo-enigma-frontend-bydm.vercel.app',
  'https://turbo-enigma-jw51.vercel.app',
  'https://turbo-enigma.vercel.app',
  'https://turbo-enigma-frontend-sq3h.vercel.app',
  'https://design-center.netlify.app',
  'https://designcenter.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

// Optional env-configured single origin (e.g., when testing from a custom domain)
const envOrigin = process.env.CORS_ORIGIN;
const baseOrigins = envOrigin && !staticOrigins.includes(envOrigin)
  ? [...staticOrigins, envOrigin]
  : staticOrigins;

// Regex patterns to allow local development hosts (any port)
const allowLocalhost = process.env.CORS_ALLOW_LOCALHOST !== '0';
const allowLan = process.env.CORS_ALLOW_LAN === '1';

const localOriginPatterns = [
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/
];

// Optionally allow LAN IPs like 192.168.x.x:PORT in dev
if (allowLan) {
  localOriginPatterns.push(/^https?:\/\/10\.\d+\.\d+\.\d+(?::\d+)?$/);
  localOriginPatterns.push(/^https?:\/\/192\.168\.\d+\.\d+(?::\d+)?$/);
}

function originDelegate(origin, callback) {
  // Allow non-browser requests (no origin)
  if (!origin) return callback(null, true);

  // Static explicit origins
  if (baseOrigins.includes(origin)) return callback(null, true);

  // Dev-friendly localhost/127.0.0.1[/LAN] patterns
  if (allowLocalhost && localOriginPatterns.some((re) => re.test(origin))) {
    return callback(null, true);
  }

  // Block anything else
  return callback(null, false);
}

const corsOptions = {
  origin: originDelegate,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
