# Design Center SaaS - Repository Rules & Conventions

## Project Overview
**Design Center SaaS** is a full-stack monorepo for a real estate-focused design platform combining:
- **Frontend**: Next.js 15 + React 19 + TypeScript (Spanish UI)
- **Backend**: Express.js + MongoDB + Mongoose
- **Architecture**: Monorepo with npm workspaces

## Repository Structure

### Root Directory (`/`)
- `package.json` - Workspace orchestration with scripts for both frontend/backend
- `*.md` files - Comprehensive documentation and guides
- `*.js` files - Standalone maintenance scripts (find-template.js, sync-design-objects.js, etc.)
- `.github/workflows/` - CI/CD automation
- `frontend/` - Next.js application
- `backend/` - Express.js API server

### Frontend (`/frontend`)
- **Framework**: Next.js App Router (`src/app/`)
- **Styling**: Tailwind CSS + custom SCSS
- **State**: Context-based (AuthContext, NotificationContext)
- **Language**: Spanish UI with internationalization considerations
- **Key Features**: Template gallery, brand customization, AI enhancement, proposals

### Backend (`/backend`)
- **Framework**: Express.js with MongoDB/Mongoose
- **Structure**: Routes-based organization (`routes/`)
- **Models**: Mongoose schemas (`models/`)
- **Services**: External integrations (`services/`)
- **Scripts**: Database management (`scripts/`)

## Development Conventions

### File Naming
- **Components**: PascalCase (`DashboardLayout.jsx`)
- **Pages**: kebab-case for routes (`brand-kit/`, `ai-enhancement/`)
- **Utilities**: camelCase (`authUtils.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Styles**: kebab-case (`dashboard-layout.scss`)

### Code Organization
- **Frontend Pages**: `src/app/[route]/page.jsx`
- **Components**: `src/components/[category]/ComponentName.jsx`
- **Contexts**: `src/contexts/ContextName.jsx`
- **Utilities**: `src/utils/utilityName.js`
- **Backend Routes**: `routes/routeName.js`
- **Models**: `models/ModelName.js`
- **Services**: `services/serviceName.js`

### Authentication Flow
- **Frontend**: JWT stored in localStorage with AuthContext
- **Backend**: JWT validation with 7-day expiry
- **Security Note**: Frontend `checkAuth` currently bypasses backend validation

### Database Conventions
- **Connection**: MongoDB with retry logic and reconnection handling
- **Models**: Mongoose with custom ID strategies
- **Plans**: User plan-based feature gating (free, premium, enterprise)

## Environment Configuration

### Backend Environment Variables
```bash
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secure_random_string
PORT=4000

# Optional Integrations
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CANVA_CLIENT_ID=
CANVA_CLIENT_SECRET=

# Development
ALLOW_PDF_NON_PREMIUM=true
```

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Security Guidelines

### Critical Security Issues
1. **JWT Secret**: Never use default `"your_jwt_secret"` in production
2. **Frontend Auth**: `checkAuth` should validate tokens with backend
3. **File Uploads**: Stored locally - needs S3 integration for production
4. **Rate Limiting**: Missing on auth endpoints
5. **Environment Files**: Never commit `.env` files

### Best Practices
- Always validate user permissions on backend
- Implement proper error handling without exposing internals
- Use HTTPS in production
- Validate file uploads (type, size, content)
- Sanitize user inputs

## Deployment Strategy

### Frontend (Vercel Recommended)
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables required: `NEXT_PUBLIC_API_URL`

### Backend (AWS/Railway/Render)
- Start command: `npm start`
- Port: Process.env.PORT or 4000
- Requires: MongoDB connection, file storage solution
- Docker support available

## File Storage Strategy
- **Current**: Local filesystem (`/uploads`)
- **Production**: Requires S3 or similar cloud storage
- **File Types**: Templates, images, PDFs, design JSON

## Common Issues & Solutions

### Build Issues
- **Frontend**: Remove `.next` from git, ensure dependencies installed
- **Backend**: Check MongoDB connection, verify environment variables
- **Monorepo**: Run `npm install` in root, then individual workspaces

### Runtime Issues
- **Auth Failures**: Check JWT_SECRET and token expiry
- **File Upload Errors**: Verify multer configuration and storage paths
- **Database Errors**: Check MongoDB URI and network connectivity

## Development Workflow

### Starting Development
```bash
# Root directory
npm install
npm run dev  # Starts both frontend and backend

# Individual services
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 4000
```

### Testing Strategy
- **Current**: No automated tests implemented
- **Recommended**: Jest for backend, React Testing Library for frontend
- **Coverage**: Auth flows, template operations, file uploads

### Code Quality
- **Linting**: ESLint configuration present
- **Formatting**: Prettier recommended
- **TypeScript**: Strict mode enabled for frontend

## Feature Implementation Status

### Completed Features
- ✅ User authentication and profiles
- ✅ Template gallery and management
- ✅ Brand kit customization
- ✅ File upload system
- ✅ Basic proposal generation

### Partial Implementation
- 🔄 Canva integration (API stubs present)
- 🔄 AI image enhancement (UI ready, backend partial)
- 🔄 Advanced analytics (mentioned in docs)

### Planned Features
- 📋 Advanced template editor
- 📋 Team collaboration
- 📋 Advanced AI features
- 📋 Mobile app

## Maintenance Scripts

### Backend Scripts
- `npm run init-db` - Initialize database with sample data
- `npm run migrate-templates` - Template migration utilities
- `npm run cleanup-uploads` - Clean orphaned files

### Root Scripts
- `find-template.js` - Template search utilities
- `sync-design-objects.js` - Design synchronization
- Various maintenance and data management scripts

## Dependencies Management

### Frontend Critical Dependencies
- Next.js 15, React 19, TypeScript
- Tailwind CSS, Framer Motion
- Fabric.js (canvas manipulation)
- html2canvas, JSZip (export functionality)

### Backend Critical Dependencies
- Express.js, Mongoose
- Multer (file uploads)
- Puppeteer (PDF generation)
- Canvas (image processing)

### Dependency Issues
- **Frontend**: Remove unused `mongoose` dependency
- **Backend**: Ensure native dependencies work in deployment environment
- **Security**: Regular dependency audits recommended

## Git Conventions

### Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Critical fixes

### Commit Messages
- Use conventional commits format
- Include scope when relevant: `feat(auth): add password reset`
- Reference issues: `fixes #123`

### Ignored Files
- `.env` files (all environments)
- `node_modules/`
- `.next/` (should be added to .gitignore)
- `uploads/` (local file storage)
- IDE-specific files

## Performance Considerations

### Frontend Optimization
- Image optimization with Next.js Image component
- Code splitting with dynamic imports
- Bundle analysis with `@next/bundle-analyzer`

### Backend Optimization
- Database indexing for frequently queried fields
- File upload size limits
- Response caching for static content
- Connection pooling for MongoDB

## Monitoring & Logging

### Current State
- Basic console logging
- No structured logging or monitoring

### Recommendations
- Implement structured logging (Winston/Pino)
- Error tracking (Sentry)
- Performance monitoring
- Database query monitoring

## Documentation Standards

### Code Documentation
- JSDoc for functions and components
- README files for major features
- API documentation for backend endpoints

### User Documentation
- Setup guides (present and comprehensive)
- Feature guides (extensive markdown files)
- Deployment instructions (detailed)

## Support & Troubleshooting

### Common Commands
```bash
# Reset development environment
npm run clean && npm install

# Database reset
npm run init-db

# Check service health
curl http://localhost:4000/health
curl http://localhost:3000/api/health
```

### Debug Information
- Frontend: Check browser console and Network tab
- Backend: Check server logs and MongoDB connection
- File uploads: Verify disk space and permissions

---

**Last Updated**: December 2024
**Maintainer**: Development Team
**Version**: 1.0.0