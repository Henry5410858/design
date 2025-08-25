# 🎨 Design System - UI Components & Styling

This document outlines the comprehensive design system implemented for the Design Center application, following the specifications for colors, typography, buttons, and component styling.

## 🎯 Overview

The design system provides a consistent, scalable foundation for building user interfaces with:
- **Neutral base colors** (grays, whites, light neutrals)
- **Dynamic brand colors** from user's uploaded brand kit
- **Clean typography** with clear hierarchy
- **Responsive components** with smooth animations
- **Accessibility-first** design principles

## 🎨 Color System

### Brand Colors
- **Primary**: `#31dFC5` (Teal)
- **Secondary**: `#01AAC7` (Blue)
- **Accent**: `#41015F` (Purple)

### Neutral Palette
- **50**: `#fafafa` (Lightest)
- **100**: `#f5f5f5`
- **200**: `#e5e5e5`
- **300**: `#d4d4d4`
- **400**: `#a3a3a3`
- **500**: `#737373`
- **600**: `#525252`
- **700**: `#404040`
- **800**: `#262626`
- **900**: `#171717` (Darkest)

### Semantic Colors
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Yellow)
- **Error**: `#ef4444` (Red)
- **Info**: `#3b82f6` (Blue)

## 📝 Typography

### Font Families
- **Base**: Inter (System fallbacks)
- **Display**: Poppins (Headings)

### Type Scale
- **Title XL**: 3rem (48px) / Bold
- **Title LG**: 2.25rem (36px) / Bold
- **Title**: 1.875rem (30px) / Bold
- **Subtitle LG**: 1.25rem (20px) / Medium
- **Subtitle**: 1.125rem (18px) / Medium
- **Body LG**: 1.125rem (18px) / Regular
- **Body**: 1rem (16px) / Regular
- **Body SM**: 0.875rem (14px) / Regular
- **Caption**: 0.75rem (12px) / Regular

## 🔘 Button Components

### Variants
- **Primary**: Filled with brand color, white text
- **Secondary**: Outlined with brand color
- **Ghost**: Transparent with neutral text

### Sizes
- **SM**: `px-3 py-2` (Small)
- **MD**: `px-4 py-2` (Default)
- **LG**: `px-6 py-3` (Large)

### Features
- Rounded corners (`rounded-2xl`)
- Smooth transitions (150-200ms)
- Hover lift effects
- Loading states
- Icon support (left/right)

### Usage
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="lg" leftIcon={<FiStar />}>
  Actualizar Plan
</Button>
```

## 🃏 Card Components

### Variants
- **Base**: Standard card with hover effects
- **Interactive**: Clickable with hover states

### Padding Options
- **SM**: `p-4` (Small)
- **MD**: `p-6` (Default)
- **LG**: `p-8` (Large)
- **None**: No padding

### Features
- Rounded corners (`rounded-2xl`)
- Soft shadows with hover lift
- Border color changes on hover
- Smooth transitions

### Usage
```tsx
import { Card } from '@/components/ui';

<Card variant="interactive" padding="md" onClick={handleClick}>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

## 📝 Input Components

### Features
- Labels and helper text
- Error states with validation
- Left/right icon support
- Focus states with brand colors
- Responsive design

### Usage
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  leftIcon={<FiMail />}
  error="Please enter a valid email"
/>
```

## 🪟 Modal Components

### Features
- Multiple sizes (SM, MD, LG, XL)
- Backdrop blur effects
- Keyboard navigation (Escape key)
- Click outside to close
- Responsive design

### Usage
```tsx
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
>
  <p>Modal content goes here</p>
</Modal>
```

## ⬆️ Upgrade Modal

### Purpose
Shows when users try to access premium features, encouraging plan upgrades.

### Features
- Spanish language support
- Feature list highlighting
- Clear call-to-action buttons
- Professional design

### Usage
```tsx
import { UpgradeModal } from '@/components/ui';

<UpgradeModal
  isOpen={showUpgrade}
  onClose={handleClose}
  onUpgrade={handleUpgrade}
  featureName="exportación en alta calidad"
/>
```

## 🖼️ Template Gallery

### Features
- Responsive grid layout (3-4 per row)
- Category filtering (flyers, banners, stories, docs)
- Search functionality
- Hover effects with "Editar en Canva" CTA
- Premium badge indicators
- Quick action buttons

### Grid Layout
- **Mobile**: 1 column
- **Tablet**: 2 columns
- **Desktop**: 3 columns
- **Large Desktop**: 4 columns

## 🧭 Navigation & Dashboard

### Sidebar
- Collapsible on mobile
- Icon + label navigation
- Active state indicators
- User profile section
- Plan information display

### Top Bar
- Search functionality
- Notification center
- User profile quick access
- Mobile menu button

### Dashboard Cards
- Statistics display
- Quick action buttons
- Recent templates
- Tips and recommendations

## 🎭 Animations & Transitions

### Duration
- **Fast**: 150ms
- **Normal**: 200ms (Default)
- **Slow**: 300ms

### Effects
- **Fade In**: Smooth opacity transitions
- **Slide In**: Horizontal slide animations
- **Scale In**: Subtle zoom effects
- **Lift**: Hover elevation changes

### Hover States
- **Lift**: Cards rise with shadow increase
- **Scale**: Subtle size increase
- **Color**: Brand color transitions

## 📱 Responsive Design

### Breakpoints
- **SM**: 640px (Mobile)
- **MD**: 768px (Tablet)
- **LG**: 1024px (Desktop)
- **XL**: 1280px (Large Desktop)
- **2XL**: 1536px (Extra Large)

### Mobile First
- Base styles for mobile
- Progressive enhancement for larger screens
- Touch-friendly interactions
- Optimized spacing and sizing

## 🎨 Brand Kit Integration

### Dynamic Colors
- User-uploaded brand colors automatically applied
- Logo integration in UI elements
- Consistent brand identity across templates
- Color palette generation from uploaded assets

### Implementation
```scss
// CSS Variables for dynamic brand colors
:root {
  --brand-primary: #31dFC5;
  --brand-secondary: #01AAC7;
  --brand-accent: #41015F;
}
```

## 🚀 Getting Started

### 1. Import Components
```tsx
import { Button, Card, Input, Modal } from '@/components/ui';
```

### 2. Use Design System Classes
```tsx
// Typography
<h1 className="text-title-xl">Main Heading</h1>
<p className="text-body-lg">Body text</p>

// Spacing
<div className="p-6 m-4">Content</div>

// Colors
<div className="bg-brand-primary text-white">Brand content</div>

// Shadows
<div className="shadow-lg hover:shadow-xl">Card</div>
```

### 3. Apply Animations
```tsx
// Hover effects
<div className="hover-lift">Lifting card</div>
<div className="hover-scale">Scaling element</div>

// Entrance animations
<div className="animate-fade-in">Fading in</div>
<div className="animate-slide-in">Sliding in</div>
```

## 🔧 Customization

### Adding New Colors
```scss
// In design-system.scss
$custom-color: #ff6b6b;

// In globals.css
:root {
  --custom-color: #ff6b6b;
}
```

### Creating New Components
1. Create component file in `src/components/ui/`
2. Follow existing component patterns
3. Use design system variables and mixins
4. Add to `src/components/ui/index.ts`
5. Document in this file

### Modifying Existing Styles
- Update variables in `design-system.scss`
- Modify component styles in respective files
- Ensure consistency across all components

## ♿ Accessibility

### Features
- Keyboard navigation support
- Focus indicators with brand colors
- Screen reader compatibility
- High contrast ratios
- Semantic HTML structure

### Best Practices
- Use proper ARIA labels
- Maintain focus order
- Provide alternative text
- Test with screen readers

## 🧪 Testing

### Component Testing
- Visual regression testing
- Responsive behavior verification
- Animation performance checks
- Accessibility compliance

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## 📚 Resources

### Design Tokens
- [Figma Design System](link-to-figma)
- [Storybook Component Library](link-to-storybook)
- [Design Tokens Documentation](link-to-tokens)

### Development
- [Component API Reference](link-to-api)
- [Style Guide](link-to-styleguide)
- [Contributing Guidelines](link-to-contributing)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Design Team
