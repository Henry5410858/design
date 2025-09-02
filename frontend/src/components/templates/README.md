# 🎨 Template System

A comprehensive collection of 12 professional design templates for React/Next.js applications, built with TailwindCSS.

## 📊 Template Overview

| Category | Dimensions | Templates | Description |
|----------|------------|-----------|-------------|
| **SquarePost** | 1080×1080 | 2 | Instagram/Facebook square posts |
| **Story** | 1080×1920 | 2 | Instagram/Facebook/WhatsApp stories |
| **Flyer** | 1200×1500 | 2 | Marketplace flyers (A4 format) |
| **Banner** | 1200×628 | 2 | Facebook feed banners |
| **Badge** | 800×800 | 2 | Digital badges and visual cards |
| **Brochure** | 1200×1500 | 2 | Simple 1-page documents (A4/Letter) |

## 🚀 Quick Start

### 1. Import Templates

```tsx
import { 
  SquarePostTemplate1, 
  StoryTemplate1, 
  FlyerTemplate1 
} from '@/components/templates';
```

### 2. Use Templates

```tsx
<SquarePostTemplate1 
  title="Amazing Product Launch"
  subtitle="Revolutionary Innovation"
  description="Discover our latest breakthrough product..."
  image="/assets/product.jpg"
  logo="/assets/logo.png"
  ctaText="Get Started Today"
/>
```

## 🎯 Template Features

### **Template 1 (Minimal)**
- Clean, professional design
- Subtle backgrounds and patterns
- Focus on content readability
- Professional color schemes

### **Template 2 (Vibrant)**
- Bold, eye-catching designs
- Animated elements and gradients
- Creative layouts and typography
- Modern, trendy aesthetics

## 📁 File Structure

```
src/components/templates/
├── SquarePost/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── Story/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── Flyer/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── Banner/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── Badge/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── Brochure/
│   ├── Template1.tsx
│   ├── Template2.tsx
│   └── index.ts
├── index.ts
├── ExampleUsage.tsx
└── README.md
```

## 🔧 Props Interface

All templates accept the following props:

```tsx
interface TemplateProps {
  title: string;           // Required: Main headline
  subtitle?: string;        // Optional: Secondary headline
  description?: string;     // Optional: Body text
  image?: string;          // Optional: Main image URL
  logo?: string;           // Optional: Company logo URL
  ctaText?: string;        // Optional: Call-to-action button text
}
```

## 🎨 Design Principles

### **Responsive Design**
- Fixed aspect ratios maintained
- Scalable using CSS transforms
- Mobile-friendly layouts

### **Typography**
- Clear hierarchy with proper font weights
- Readable font sizes for all screen sizes
- Consistent spacing and line heights

### **Color Schemes**
- **Template 1**: Professional grays and subtle colors
- **Template 2**: Vibrant gradients and bold colors
- High contrast for accessibility

### **Layout**
- Grid-based systems for consistency
- Proper spacing and padding
- Balanced visual weight distribution

## 📱 Usage Examples

### SquarePost for Social Media

```tsx
<SquarePostTemplate1 
  title="Summer Sale!"
  subtitle="Up to 50% Off"
  description="Don't miss our biggest sale of the year"
  image="/assets/summer-sale.jpg"
  logo="/assets/store-logo.png"
  ctaText="Shop Now"
/>
```

### Story for Instagram

```tsx
<StoryTemplate2 
  title="New Collection"
  subtitle="Available Now"
  description="Discover our latest fashion collection"
  image="/assets/collection.jpg"
  logo="/assets/brand-logo.png"
  ctaText="View Collection"
/>
```

### Flyer for Events

```tsx
<FlyerTemplate1 
  title="Tech Conference 2024"
  subtitle="Innovation & Future"
  description="Join industry leaders for the most exciting tech event of the year"
  image="/assets/conference.jpg"
  logo="/assets/event-logo.png"
  ctaText="Register Now"
/>
```

## 🛠️ Customization

### **Adding New Templates**

1. Create a new template file in the appropriate category folder
2. Follow the existing naming convention: `TemplateX.tsx`
3. Export from the category's `index.ts`
4. Add to the main `index.ts` file

### **Modifying Existing Templates**

1. Templates are fully customizable
2. Modify colors, fonts, and layouts as needed
3. Maintain the props interface for consistency
4. Test responsiveness across different screen sizes

### **Styling with TailwindCSS**

- All templates use TailwindCSS classes
- Easy to customize colors, spacing, and typography
- Responsive breakpoints included
- Hover effects and animations built-in

## 📏 Dimensions & Formats

### **Social Media**
- **SquarePost**: 1080×1080 (1:1 ratio)
- **Story**: 1080×1920 (9:16 ratio)

### **Print & Digital**
- **Flyer**: 1200×1500 (4:5 ratio, A4 equivalent)
- **Banner**: 1200×628 (1.91:1 ratio, Facebook feed)
- **Badge**: 800×800 (1:1 ratio)
- **Brochure**: 1200×1500 (4:5 ratio, A4 equivalent)

## 🚀 Performance Tips

1. **Image Optimization**: Use optimized images for better performance
2. **Lazy Loading**: Implement lazy loading for multiple templates
3. **Component Splitting**: Import only the templates you need
4. **CSS Optimization**: TailwindCSS automatically purges unused styles

## 🔍 Troubleshooting

### **Common Issues**

1. **Template not rendering**: Check if all required props are provided
2. **Layout broken**: Verify TailwindCSS is properly configured
3. **Images not loading**: Ensure image paths are correct
4. **Responsive issues**: Check if parent container has proper dimensions

### **Debug Mode**

Enable debug mode by adding console logs to see prop values:

```tsx
const TemplateComponent: React.FC<TemplateProps> = (props) => {
  console.log('Template props:', props);
  // ... rest of component
};
```

## 📚 Additional Resources

- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [React TypeScript Guide](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

1. Follow the existing code structure
2. Maintain consistent prop interfaces
3. Add proper TypeScript types
4. Include responsive design considerations
5. Test across different screen sizes

## 📄 License

This template system is part of the LupaProp project and follows the same licensing terms.

---

**Happy Designing! 🎨✨**
