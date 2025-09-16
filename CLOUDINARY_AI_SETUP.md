# Cloudinary AI Setup Guide

## Overview
This project now includes Cloudinary AI integration for automatic image enhancement. When users upload images, they can choose to enhance them with AI to improve lighting, sharpness, and color correction.

## Features
- **Automatic Enhancement Prompt**: After uploading an image, users get a prompt asking if they want AI enhancement
- **Manual Enhancement Button**: Users can select any image and click "Mejorar con IA" to enhance it
- **Real-time Feedback**: Loading indicators and success/error messages
- **Professional Results**: Uses Cloudinary's AI to adjust lighting, sharpness, and colors

## Setup Instructions

### 1. Get Cloudinary Credentials
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Go to your [Dashboard](https://cloudinary.com/console)
3. Copy your Cloud Name, API Key, and API Secret

### 2. Configure Environment Variables
Create a `.env.local` file in the frontend directory with:

```bash
# Cloudinary AI Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
NEXT_PUBLIC_CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Restart Development Server
```bash
npm run dev
```

## How It Works

### Image Upload Flow
1. User uploads an image
2. Image is added to canvas
3. System prompts: "¿Te gustaría mejorar esta imagen con IA?"
4. If yes, image is enhanced using Cloudinary AI
5. Enhanced image replaces original

### Manual Enhancement
1. User selects an image on canvas
2. Clicks "Mejorar con IA" button in Elements tab
3. Image is enhanced and replaced automatically

### AI Enhancements Applied
- **Lighting**: Automatic brightness adjustment
- **Sharpness**: Image sharpening for clarity
- **Color Correction**: Enhanced color saturation and balance
- **Professional Quality**: Optimized for print and digital use

## Technical Details

### Cloudinary Transformations Used
- `e_auto_brightness`: Automatic lighting adjustment
- `e_sharpen:100`: Sharpness enhancement
- `e_auto_color`: Color correction
- `e_saturation:50`: Vibrant color enhancement

### Error Handling
- Graceful fallback to original image if enhancement fails
- User-friendly error messages
- Loading indicators during processing

## Cost Considerations
- Cloudinary offers a free tier with generous limits
- AI transformations count toward your usage
- Check your Cloudinary dashboard for usage statistics

## Troubleshooting

### Common Issues
1. **"Cloudinary enhancer not configured"**: Check environment variables
2. **Enhancement fails**: Verify API credentials and network connection
3. **Images not loading**: Check CORS settings in Cloudinary

### Debug Mode
Enable console logging to see detailed enhancement process:
- Open browser DevTools
- Check Console tab for enhancement logs
- Look for "✅ Image enhanced successfully" messages

## Future Enhancements
- Batch image enhancement
- Custom enhancement presets
- Before/after comparison view
- Integration with other AI services (Clipdrop, Let's Enhance)
