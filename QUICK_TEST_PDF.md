# Quick PDF Test Guide

## Pre-Deployment Testing (Local)

### 1. Test Backend Locally
```bash
cd backend
npm start
```

### 2. Test Endpoints
```bash
# Get auth token from local login
TOKEN="your_auth_token_here"

# Test diagnostics
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/proposals/diagnostics

# Test AI enhancement
curl -X POST http://localhost:4000/api/proposals/enhance-intro \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"Hello","clientName":"Test","valueProps":["Quality"]}'

# Test PDF generation
curl -X POST http://localhost:4000/api/proposals/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "client":{"name":"Test Client","valueProps":["Quality","Speed"]},
    "items":[{"title":"Property","description":"Nice place","price":100000}],
    "template":"dossier-express"
  }' > test.pdf && echo "PDF saved as test.pdf"
```

---

## Post-Deployment Testing (Production)

### Browser Console Tests

```javascript
// 1. Get auth token
const token = localStorage.getItem('auth_token') || localStorage.getItem('token');

// 2. Test diagnostics
fetch('https://design-backend-6vx4.onrender.com/api/proposals/diagnostics', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => {
  console.log('✅ Diagnostics:', d);
  console.log('Puppeteer:', d.dependencies.puppeteer);
  console.log('Canvas:', d.dependencies.canvas);
})
.catch(e => console.error('❌ Error:', e.message));

// 3. Test health endpoint (public)
fetch('https://design-backend-6vx4.onrender.com/api/health')
.then(r => r.json())
.then(d => console.log('✅ Health:', d));

// 4. Quick enhance-intro test
fetch('https://design-backend-6vx4.onrender.com/api/proposals/enhance-intro', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: 'Test',
    clientName: 'Test Client',
    valueProps: ['Quality', 'Speed']
  })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log(d.error ? '❌ Error: ' + d.error : '✅ Success: ' + d.enhancedText))
.catch(e => console.error('❌ Error:', e));
```

---

## Expected Results

### Diagnostics Response (Success)
```json
{
  "dependencies": {
    "puppeteer": "installed",
    "canvas": "installed"
  },
  "environment_variables": {
    "PUPPETEER_EXECUTABLE_PATH": "set",
    "CHROME_PATH": "set"
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.x.x"
  }
}
```

### Enhance-Intro Response (Success)
```json
{
  "enhancedText": "Original text\n\nHola Test Client,\n\nGracias por..."
}
```

### PDF Generation (Success)
- Status: 200
- Content-Type: application/pdf
- PDF downloads automatically

---

## Failure Scenarios & Fixes

### Scenario 1: Puppeteer Missing
```json
{
  "error": "PDF generation failed",
  "diagnostics": {
    "puppeteer": "missing"
  }
}
```
**Fix:** Wait for build to complete, clear Render cache, redeploy

### Scenario 2: Chromium Not Found
```
/usr/bin/chromium-browser: not found
```
**Fix:** Check render.yaml build command, verify apt-get installation succeeded

### Scenario 3: Canvas Optional Warning
```json
{
  "diagnostics": {
    "canvas": "missing"
  }
}
```
**Fix:** This is OK! Canvas is optional. PDF will still generate without image optimization.

### Scenario 4: 500 Error After Build Success
**Check:**
1. Render logs for the actual error message
2. Browser console for detailed error
3. Backend environment variables are correctly set

---

## Performance Expectations

- First PDF generation: 3-5 seconds
- Subsequent requests: 1-2 seconds
- Enhance-intro: <1 second
- File size: 50-200 KB per PDF

---

## Rollback Procedure

If tests fail:

1. **In Render Dashboard:**
   - Go to Deployments
   - Click previous working deployment
   - Click "Redeploy"

2. **Via CLI:**
   ```bash
   git log --oneline  # Find previous commit
   git revert HEAD    # Revert last changes
   git push origin main  # Push to trigger redeploy
   ```

3. **Verify Rollback:**
   - Wait 5 minutes for Render to detect new push
   - Check service health
   - Test endpoints again