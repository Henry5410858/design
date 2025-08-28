# 🎨 Demo: Canva Integration Testing

## 🚀 Quick Start Demo

### 1. Start the Backend
```bash
cd backend
npm start
```

### 2. Start the Frontend (in another terminal)
```bash
cd frontend
npm run dev
```

### 3. Test the Integration

#### Step 1: Navigate to Canva Page
- Open browser: `http://localhost:3000/canva`
- You should see the template gallery

#### Step 2: Test Plan-Based Access
**Free Plan Users:**
- Should see upgrade prompt
- No access to templates

**Premium/Ultra-Premium Users:**
- Should see template gallery
- Access to design tools

#### Step 3: Test Template Selection
- Click on any template
- Editor modal should open
- Check toolbar functionality

#### Step 4: Test Export Features
- Select export format (PNG/JPG/PDF)
- PDF should be restricted to Ultra-Premium
- Export button should work

#### Step 5: Test Brand Kit
- Click "Apply Brand Kit"
- Should show success/error handling

## 🧪 Testing Scenarios

### Scenario 1: Free User Access
1. Set user plan to 'Free' in UserContext
2. Navigate to `/canva`
3. **Expected**: Upgrade prompt with plan comparison

### Scenario 2: Premium User Access
1. Set user plan to 'Premium'
2. Navigate to `/canva`
3. **Expected**: Template gallery with basic templates
4. **Expected**: PNG/JPG export only

### Scenario 3: Ultra-Premium User Access
1. Set user plan to 'Ultra-Premium'
2. Navigate to `/canva`
3. **Expected**: Full template access
4. **Expected**: PNG/JPG/PDF export

### Scenario 4: Template Filtering
1. Use category filters
2. Use search functionality
3. **Expected**: Templates filter correctly

### Scenario 5: Editor Functionality
1. Open editor modal
2. Test toolbar buttons
3. **Expected**: All buttons responsive
4. **Expected**: Loading states work

## 🔍 Debug Information

### Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('canva_debug', 'true');
```

### Check User Context
```javascript
// In browser console
console.log('User Context:', useUser());
console.log('Canva Context:', useCanva());
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Navigate through the app
3. Check API calls to `/api/canva/*`

## 🐛 Common Issues & Solutions

### Issue 1: Templates Not Loading
**Symptoms**: Empty template gallery
**Solutions**:
- Check backend is running
- Verify CanvaContext is working
- Check console for errors

### Issue 2: Editor Modal Not Opening
**Symptoms**: Clicking template does nothing
**Solutions**:
- Check template click handler
- Verify modal component import
- Check for JavaScript errors

### Issue 3: Export Not Working
**Symptoms**: Export button disabled or fails
**Solutions**:
- Verify user plan is correct
- Check export format selection
- Verify design ID exists

### Issue 4: Plan Restrictions Not Working
**Symptoms**: Free users can access features
**Solutions**:
- Check UserContext plan value
- Verify plan validation logic
- Check component access control

## 📊 Expected Results

### Free Plan Users
- ❌ No Canva access
- ❌ No templates visible
- ✅ Upgrade prompt displayed
- ✅ Clear plan comparison

### Premium Plan Users
- ✅ Canva access granted
- ✅ Basic templates visible (8 templates)
- ✅ PNG/JPG export available
- ❌ PDF export restricted
- ✅ Brand kit access

### Ultra-Premium Plan Users
- ✅ Full Canva access
- ✅ All templates visible (12 templates)
- ✅ PNG/JPG/PDF export
- ✅ Full brand kit access
- ✅ Advanced features

## 🎯 Success Criteria

### ✅ Integration Working
- [ ] Template gallery displays correctly
- [ ] Plan-based access control works
- [ ] Editor modal opens and closes
- [ ] Export functionality responds
- [ ] Brand kit integration works
- [ ] Responsive design functions

### ✅ User Experience
- [ ] Clear navigation to Canva
- [ ] Intuitive template selection
- [ ] Smooth editor transitions
- [ ] Helpful error messages
- [ ] Loading states visible
- [ ] Plan restrictions clear

### ✅ Technical Performance
- [ ] Fast page load times
- [ ] Smooth animations
- [ ] No console errors
- [ ] Responsive interactions
- [ ] Memory usage stable
- [ ] Network requests efficient

## 🚀 Next Steps After Demo

1. **Apply for Canva Developer Access**
   - Visit: https://www.canva.com/developers/
   - Complete application form
   - Wait for approval

2. **Get Production Credentials**
   - Client ID
   - Client Secret
   - API access

3. **Configure Production Environment**
   - Set environment variables
   - Update domain configurations
   - Deploy to production

4. **User Testing**
   - Internal team testing
   - Beta user testing
   - Feedback collection

---

## 🎉 **Demo Complete!**

Your Canva integration is working locally and ready for production deployment!

**Need help with any specific testing scenario? Let me know!** 🚀
