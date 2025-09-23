const cors = require('cors');

// Centralized CORS configuration with optional dynamic origin from env
const staticOrigins = [
  'https://turbo-enigma-frontend.vercel.app',
  'https://turbo-enigma-frontend-bydm.vercel.app',
  'https://turbo-enigma-jw51.vercel.app',
  'https://turbo-enigma.vercel.app',
  'https://turbo-enigma-frontend-sq3h.vercel.app',
  'https://design-center.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://designcenter.vercel.app'
];

const envOrigin = process.env.CORS_ORIGIN;
const origins = envOrigin && !staticOrigins.includes(envOrigin)
  ? [...staticOrigins, envOrigin]
  : staticOrigins;

const corsOptions = {
  origin: origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = cors(corsOptions);
