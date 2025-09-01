# 🏠 Centro de Diseño - Bienes Raíces

Un centro de diseño profesional para agentes de bienes raíces, integrado con Canva para crear contenido visual atractivo.

## ✨ Características Principales

### 🔐 Autenticación Segura
- Sistema de login que acepta tokens del sistema principal
- Validación JWT con almacenamiento en localStorage
- Control de acceso basado en planes (Free, Premium, Ultra-Premium)
- Redirección automática si el token no es válido

### 🖥 Dashboard Moderno
- Interfaz SaaS minimalista con Tailwind CSS
- Sidebar en español: "Plantillas", "Mi Marca", "Descargas"
- Topbar con información del usuario y plan
- Diseño responsive para todos los dispositivos
- Acceso en 2 clics a las plantillas

### 🎨 Galería de Plantillas
- **12 plantillas profesionales** en 6 categorías:
  1. **IG/FB Square Post** (1080×1080) - 2 variantes
  2. **IG/FB/WSP Story** (1080×1920) - 2 variantes
  3. **Marketplace Flyer** (1200×1500) - 2 variantes
  4. **FB Feed Banner** (1200×628) - 2 variantes
  5. **Digital Badge/Visual Card** (1080×1350) - 2 variantes
  6. **Brochure/Document** (A4) - 2 variantes

- Vista previa en vivo de cada plantilla
- Integración directa con Canva (un clic para editar)
- Filtros por categoría y búsqueda
- Indicadores de plan requerido

### 🏷 Kit de Marca
- Subida de logo (PNG/SVG) con validación
- Selector de colores primarios y secundarios
- Vista previa de la marca aplicada
- Almacenamiento en localStorage
- Aplicación automática a las plantillas

### 🔒 Control de Acceso por Plan
- **Free**: Acceso básico a plantillas
- **Premium**: Plantillas avanzadas y personalización
- **Ultra-Premium**: Todas las funciones y plantillas exclusivas
- Componente `FeatureGate` para restricción de funciones
- Modal de actualización con enlace a facturación

### ✍ Integración con Canva
- Apertura directa en Canva con URLs de edición
- Soporte para múltiples formatos de exportación
- Descarga en lote con JSZip
- Gestión de diseños descargados

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de desarrollador de Canva (opcional)

### 1. Clonar el repositorio
```bash
git clone <your-repo-url>
cd reddragon/frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env.local`:
```bash
# Plataforma Principal
NEXT_PUBLIC_MAIN_PLATFORM_URL=https://tu-plataforma.com
NEXT_PUBLIC_BILLING_URL=https://tu-plataforma.com/billing

# Canva (opcional)
NEXT_PUBLIC_CANVA_CLIENT_ID=tu_canva_client_id
NEXT_PUBLIC_CANVA_REDIRECT_URI=https://tu-dominio.com/canva/callback

# JWT
JWT_SECRET=tu_clave_secreta_jwt
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```

### 5. Construir para producción
```bash
npm run build
npm start
```

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   └── auth/          # Autenticación
│   │   ├── templates/         # Página de plantillas
│   │   ├── brand-kit/         # Página del kit de marca
│   │   ├── downloads/         # Página de descargas
│   │   ├── layout.tsx         # Layout principal
│   │   └── page.tsx           # Dashboard principal
│   ├── components/            # Componentes React
│   │   ├── layout/            # Componentes de layout
│   │   ├── FeatureGate.tsx    # Control de acceso
│   │   ├── BrandKit.tsx       # Gestión de marca
│   │   └── TemplateGallery.tsx # Galería de plantillas
│   ├── context/               # Contextos de React
│   │   └── AuthContext.tsx    # Autenticación
│   ├── data/                  # Datos estáticos
│   │   └── templates.json     # Configuración de plantillas
│   └── types/                 # Tipos TypeScript
│       └── index.ts           # Interfaces y tipos
├── public/                    # Archivos estáticos
│   └── thumbnails/           # Imágenes de plantillas
└── package.json               # Dependencias
```

### Componentes Principales

#### `DashboardLayout`
- Sidebar responsive con navegación
- Topbar con información del usuario
- Manejo de autenticación y redirección

#### `TemplateGallery`
- Grid responsive de plantillas
- Filtros por categoría y búsqueda
- Integración directa con Canva
- Indicadores de plan requerido

#### `BrandKit`
- Subida y gestión de logo
- Selector de colores corporativos
- Vista previa de la marca
- Almacenamiento local

#### `FeatureGate`
- Control de acceso basado en plan
- Modal de actualización
- Enlace a facturación

### API Routes

#### `/api/auth/login`
- Validación de token del sistema principal
- Generación de JWT de sesión
- Retorno de datos del usuario

#### `/api/auth/validate`
- Validación de JWT de sesión
- Retorno de datos del usuario autenticado

## 🎨 Personalización

### Plantillas
Las plantillas se configuran en `src/data/templates.json`:
```json
{
  "id": "square-post-1",
  "category": "IG/FB Square Post",
  "name": "Post Cuadrado Minimalista",
  "thumbnail": "/thumbnails/square-post-1.jpg",
  "link": "https://www.canva.com/design/DAF123456789",
  "dimensions": "1080×1080",
  "description": "Diseño limpio y profesional",
  "plan": "Free"
}
```

### Colores de Marca
Los colores por defecto se pueden personalizar en `BrandKit.tsx`:
```typescript
const [brandKit, setBrandKit] = useState<BrandKitType>({
  primaryColor: '#00525b',    // Color principal
  secondaryColor: '#01aac7',  // Color secundario
  accentColor: '#32e0c5'      // Color de acento
});
```

## 🔧 Desarrollo

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run start` - Servidor de producción
- `npm run lint` - Verificación de código

### Tecnologías Utilizadas
- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Estado**: React Context API
- **Autenticación**: JWT con localStorage
- **Integración**: Canva (enlaces directos)
- **Exportación**: JSZip para descargas múltiples

### Estándares de Código
- TypeScript estricto
- Componentes funcionales con hooks
- Manejo de errores consistente
- Comentarios en español
- Nombres de variables descriptivos

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📱 Responsive Design

El diseño es completamente responsive con breakpoints de Tailwind:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔒 Seguridad

- Validación de tokens JWT
- Sanitización de inputs
- Control de acceso basado en roles
- Redirección segura en autenticación fallida

## 🧪 Testing

### Pruebas Manuales
1. **Autenticación**: Probar flujo de login/logout
2. **Plantillas**: Verificar filtros y búsqueda
3. **Canva**: Probar enlaces de edición
4. **Responsive**: Verificar en diferentes dispositivos
5. **Plan**: Probar restricciones de acceso

## 📈 Próximas Funcionalidades

- [ ] Integración completa con API de Canva
- [ ] Sistema de versiones de diseños
- [ ] Colaboración en tiempo real
- [ ] Analytics de uso de plantillas
- [ ] Sistema de favoritos
- [ ] Exportación a más formatos
- [ ] Integración con CRM de bienes raíces

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@tuempresa.com
- 📱 WhatsApp: +1 (555) 123-4567
- 🌐 Sitio web: https://tuempresa.com/soporte

---

**Desarrollado con ❤️ para profesionales de bienes raíces**
