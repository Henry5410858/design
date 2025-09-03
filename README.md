# Design Center SaaS

## Overview
A modular, scalable web design and proposal generation hub. Features include:
- Dashboard with plan-based feature access
- Template Gallery
- Brand Customization
- Online Editing (Canva SDK or custom)
- AI Image Enhancement
- Proposal PDF Generator
- Smart Campaign Calendar
- AI Text Automation

## Tech Stack
- Frontend: Next.js (React), Saas
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT (demo), plan-based access
- Deployment: Docker, GitHub Actions, Vercel (frontend), AWS (backend, S3, RDS)

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Setup
```sh
# Backend
cd backend
npm install
npm start

# Frontend
cd ../frontend
npm install
npm run dev
```

### API Endpoints
- `POST /api/auth/signup` — Register
- `POST /api/auth/signin` — Login
- `POST /api/auth/validate` — Validate token
- `GET /api/templates` — List templates
- ... (see code for more)

## Docker
```sh
# Build and run backend
cd backend
docker build -t designcenter-backend .
docker run -p 4000:4000 designcenter-backend

# Build and run frontend
cd ../frontend
docker build -t designcenter-frontend .
docker run -p 3000:3000 designcenter-frontend
```

## Deployment
- **Frontend:** Deploy `/frontend` to Vercel.
- **Backend:** Deploy `/backend` to AWS (EC2, Lambda, or similar).
- **Database:** Use AWS RDS (PostgreSQL or MongoDB Atlas).
- **Assets:** Use AWS S3 for templates and branding assets.

## CI/CD
- GitHub Actions: `.github/workflows/ci-cd.yml` for build/test.

## Customization
- Update backend URLs in frontend for production.
- Add real JWT and connect to main platform for auth.
- Integrate Canva SDK, AI APIs, and PDFKit as needed.

---
For more, see code comments and TODOs in each feature folder.
