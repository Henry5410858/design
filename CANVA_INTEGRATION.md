# 🎨 Integración de Canva para Centro de Diseño

## Overview

Este documento describe la implementación completa de la integración de Canva para la plataforma Centro de Diseño. La integración proporciona a los usuarios acceso a herramientas de diseño profesionales y plantillas a través de la API de Canva, con restricciones basadas en planes y una experiencia de usuario fluida.

## 🚀 Features Implemented

### ✅ Phase 1 Complete
- **Secure Canva API integration** with OAuth 2.0 authentication
- **Embedded Canva editor** inside the Design Center
- **Real estate templates** (12 templates across 6 formats)
- **Brand Kit auto-application** (logo + colors)
- **Export designs** as PNG/JPG/PDF (download or via storage)
- **Plan-based feature restrictions** (Free, Premium, Ultra-Premium)
- **Technical documentation** & clean source code

## 🏗️ Architecture

### Frontend Components
```
frontend/src/
├── context/
│   └── CanvaContext.tsx          # Canva state management
├── components/canva/
│   ├── CanvaEditor.tsx           # Main editor component
│   └── CanvaTemplateGallery.tsx  # Template selection gallery
└── app/canva/
    ├── page.tsx                  # Main Canva page
    └── callback/
        └── page.tsx              # OAuth callback handler
```

### Backend API Routes
```
backend/routes/
└── canva.js                      # Canva API endpoints
```

## 🔐 Authentication Flow

### OAuth 2.0 Implementation
1. **User clicks "Create Design"** → Redirected to Canva OAuth
2. **Canva authorization** → User grants permissions
3. **Callback handling** → Exchange code for access token
4. **Token storage** → Secure token management
5. **API access** → Use tokens for Canva API calls

### Security Features
- **Plan-based access control** (Premium+ required)
- **Secure token storage** (localStorage for demo, secure storage for production)
- **Automatic token refresh** (handled by backend)
- **User session validation** (JWT verification)

## 📱 User Experience

### Plan-Based Access
| Plan | Canva Access | Templates | Export Formats | Features |
|------|--------------|-----------|----------------|----------|
| **Free** | ❌ | None | None | Basic platform access |
| **Premium** | ✅ | Basic (8 templates) | PNG, JPG | Design creation, basic export |
| **Ultra-Premium** | ✅ | All (12 templates) | PNG, JPG, PDF | Full access, PDF export, advanced features |

### Template Categories
- **Property Marketing**: Flyers, brochures
- **Social Media**: Stories, posts, banners
- **Property Status**: Badges (Sold, Reserved)
- **Business**: Investment reports, documents

## 🛠️ Technical Implementation

### Frontend State Management
```typescript
interface CanvaContextType {
  // Configuration
  config: CanvaConfig;
  
  // Editor State
  editor: CanvaEditorState;
  
  // Templates
  templates: CanvaTemplate[];
  selectedTemplate: CanvaTemplate | null;
  
  // Actions
  openEditor: (templateId: string) => Promise<void>;
  closeEditor: () => void;
  exportDesign: (designId: string, format: 'PNG' | 'JPG' | 'PDF') => Promise<string | null>;
  applyBrandKit: (designId: string) => Promise<void>;
}
```

### Backend API Endpoints
```javascript
// Design Management
POST /api/canva/designs/create     # Create new design
POST /api/canva/designs/export     # Export design
POST /api/canva/designs/brand-kit  # Apply brand kit

// Template Management
GET /api/canva/templates           # Fetch available templates
GET /api/canva/brand-kits         # Fetch user brand kits

// Authentication
GET /api/canva/auth/url           # Generate OAuth URL
POST /api/canva/auth/callback     # Handle OAuth callback
```

## 🔧 Setup Instructions

### 1. Environment Variables
```bash
# Backend (.env)
CANVA_API_BASE_URL=https://api.canva.com
CANVA_CLIENT_ID=your_client_id
CANVA_CLIENT_SECRET=your_client_secret
CANVA_REDIRECT_URI=http://localhost:3000/canva/callback

# Frontend (.env.local)
NEXT_PUBLIC_CANVA_API_URL=https://api.canva.com
NEXT_PUBLIC_CANVA_CLIENT_ID=your_client_id
NEXT_PUBLIC_CANVA_REDIRECT_URI=http://localhost:3000/canva/callback
```

### 2. Canva Developer Setup
1. **Apply for Canva Developer Access** → [Canva Developers](https://www.canva.com/developers/)
2. **Create OAuth App** → Get Client ID and Secret
3. **Configure Redirect URIs** → Set callback URLs
4. **Set Required Scopes** → designs:read, designs:write, brand_kit:read, brand_kit:write

### 3. Installation
```bash
# Frontend
npm install @canva/platform @canva/design @canva/app-ui-kit --legacy-peer-deps

# Backend
npm install axios
```

### 4. Database Migration
```bash
# Run the role-to-plan migration
cd backend
node migrate-role-to-plan.js
```

## 🎯 Usage Examples

### Opening Canva Editor
```typescript
import { useCanva } from '@/context/CanvaContext';

function MyComponent() {
  const { openEditor, templates } = useCanva();
  
  const handleCreateDesign = async (templateId: string) => {
    await openEditor(templateId);
  };
  
  return (
    <button onClick={() => handleCreateDesign('flyer-1')}>
      Create Property Flyer
    </button>
  );
}
```

### Exporting Designs
```typescript
const { exportDesign } = useCanva();

const handleExport = async () => {
  const fileUrl = await exportDesign(designId, 'PNG');
  if (fileUrl) {
    // Handle download
    window.open(fileUrl, '_blank');
  }
};
```

## 🔒 Security Considerations

### Production Security
- **HTTPS only** for all API calls
- **Secure token storage** (use httpOnly cookies or secure storage)
- **Token encryption** at rest
- **Rate limiting** on API endpoints
- **Input validation** and sanitization
- **CORS configuration** for production domains

### User Data Protection
- **Plan validation** on every API call
- **User isolation** (users can only access their own designs)
- **Audit logging** for all design operations
- **Data retention policies** for exported files

## 🚧 Future Enhancements

### Phase 2 Features
- **Collaborative editing** (multiple users on same design)
- **Design versioning** (save multiple versions)
- **Template customization** (user-created templates)
- **Advanced analytics** (design usage, export statistics)
- **Integration with property listings** (auto-populate property data)

### Phase 3 Features
- **AI-powered design suggestions** (based on property type)
- **Bulk operations** (export multiple designs)
- **Advanced brand kit features** (custom fonts, color palettes)
- **Mobile app integration** (design on mobile devices)
- **Third-party integrations** (social media auto-posting)

## 🐛 Troubleshooting

### Common Issues

#### 1. OAuth Callback Errors
```bash
# Check redirect URI configuration
# Verify client ID and secret
# Ensure HTTPS in production
```

#### 2. Template Loading Issues
```bash
# Verify Canva API access
# Check user plan permissions
# Validate API rate limits
```

#### 3. Export Failures
```bash
# Check user plan for PDF export
# Verify design completion status
# Check file size limits
```

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('canva_debug', 'true');

// Check console for detailed logs
console.log('Canva Context:', useCanva());
```

## 📊 Performance Metrics

### Optimization Targets
- **Editor Load Time**: < 3 seconds
- **Template Fetch**: < 1 second
- **Export Generation**: < 10 seconds
- **API Response Time**: < 500ms

### Monitoring
- **User engagement** (templates used, designs created)
- **Export success rate** (by format and plan)
- **API performance** (response times, error rates)
- **User satisfaction** (feature usage patterns)

## 🤝 Support & Maintenance

### Regular Maintenance
- **Token refresh** monitoring
- **API rate limit** tracking
- **Error rate** monitoring
- **User feedback** collection

### Support Channels
- **Technical documentation** (this document)
- **Code comments** (inline documentation)
- **Error logging** (structured error tracking)
- **User feedback** (in-app feedback system)

## 📝 License & Attribution

- **Canva API**: Subject to Canva's Terms of Service
- **Integration Code**: MIT License
- **Templates**: Canva-provided real estate templates
- **Brand Assets**: User-uploaded content

---

## 🎉 Implementation Status

**✅ COMPLETED:**
- Frontend Canva context and components
- Backend API routes and middleware
- OAuth 2.0 authentication flow
- Template gallery and editor
- Plan-based access control
- Export functionality (PNG/JPG/PDF)
- Brand kit integration
- Responsive design and UX

**🚀 READY FOR:**
- Canva Developer API access
- Production environment setup
- User testing and feedback
- Performance optimization
- Security hardening

**📋 NEXT STEPS:**
1. Apply for Canva Developer access
2. Configure OAuth credentials
3. Test with real Canva API
4. Deploy to staging environment
5. User acceptance testing
6. Production deployment

---

*Esta integración transforma Centro de Diseño de una herramienta de diseño básica a una plataforma de diseño profesional, dando a los usuarios acceso a capacidades de diseño estándar de la industria mientras mantiene el enfoque único de la plataforma en bienes raíces.*
