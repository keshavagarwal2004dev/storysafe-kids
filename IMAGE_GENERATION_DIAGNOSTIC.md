# Image Generation Debugging Guide

## Current Issue
Images appear to be generating in the background (UI shows skeleton loaders), but no actual image data is being produced.

## Quick Debugging Steps

### 1. Verify Gemini API Key Configuration
Your app uses `VITE_GEMINI_API_KEY` environment variable. Check it's set:

**For local development:**
- Create a `.env.local` file in the project root:
  ```
  VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
  ```
- Get or generate a Gemini API key at: https://aistudio.google.com/app/apikeys

**For production/deployment:**
- Set the environment variable in your hosting platform (Vercel, Netlify, etc.)

### 2. Run the Diagnostic Function
Once your app is running (`npm run dev`):

1. Open browser console (F12)
2. Go to the browser's console tab
3. Run this command:
   ```javascript
   import { testImagenApiDirect } from 'src/lib/groqStoryGenerator.ts'
   testImagenApiDirect("A happy child learning about safety")
   ```

This will:
- Test the Imagen API directly
- Log the actual API response
- Show you the exact JSON structure
- Help identify if it's an auth/quota issue

### 3. Check the Response Format
The diagnostic will show what the actual Imagen API response looks like. Common formats:

**Format A: Base64 in predictions**
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgo..."
    }
  ]
}
```

**Format B: Image URI**
```json
{
  "predictions": [
    {
      "imageUri": "https://..."
    }
  ]
}
```

**Format C: Nested image data**
```json
{
  "predictions": [
    {
      "image": {
        "data": "iVBORw0KGgo..."
      }
    }
  ]
}
```

If your response format is different, we'll need to update the parsing logic in `src/lib/groqStoryGenerator.ts` in the `generateSlideImageWithPuter()` function.

### 4. Check API Usage/Quotas
- Visit: https://console.cloud.google.com/
- Go to your project's API quotas
- Check Imagen API usage and limits
- Verify you haven't exceeded free tier limits

## Updated Code Features

The latest code now includes:

✅ **Better error logging** - Logs actual API responses and errors  
✅ **Multiple response parsing paths** - Tries 4 different possible response formats  
✅ **Fallback to Gemini API** - If Imagen fails, tries Gemini Vision API  
✅ **SVG placeholder fallback** - If both APIs fail, generates a colorful SVG placeholder (images still show in UI)  
✅ **Diagnostic function** - `testImagenApiDirect()` for debugging  

## Common Issues & Solutions

### Issue: "Image generating in background..." shows forever
**Causes:**
- API key not set or invalid
- API quota exceeded
- Network timeout

**Solutions:**
1. Check API key is set in `.env.local`
2. Run diagnostic function to see actual error
3. Check cloud console for quota status
4. Try the diagnostic test to confirm API accessibility

### Issue: 401/403 Errors
**Cause:** API key missing or doesn't have Imagen API access

**Solution:**
- Verify API key has "Generative Language API" enabled
- Create new API key with proper permissions
- Check key isn't restricted to specific domains/hosts

### Issue: 429 Errors (Rate Limited)
**Cause:** Too many requests too quickly

**Solution:**
- Code now waits 30 seconds between batches
- Free tier limited to 30 requests/minute
- If generating many stories, may need paid tier

### Issue: Different response format than expected
**Solution:**
- Run diagnostic test
- Note the actual response structure
- Update `generateSlideImageWithPuter()` parsing logic
- Contact support with diagnostic output

## Testing the Fix

Once you've:
1. Set `VITE_GEMINI_API_KEY` in `.env.local`
2. Restarted dev server (`npm run dev`)
3. Confirmed API key works (run diagnostic)

Try creating a new story:
- Fill out story form
- Click "Create Story"
- Should see images populate in editor within 30-60 seconds
- Console should show: "[SafeStory][Image] Successfully generated image via Imagen API"

## Still Not Working?

1. Run the diagnostic function and copy the full output
2. Check browser console for any error messages (look for [SafeStory] prefix)
3. Verify `.env.local` file is in project root and has the key
4. Try restarting dev server after setting env variable
5. If still broken, share the diagnostic output for further debugging

## File Notes

- **Modified:** `src/lib/groqStoryGenerator.ts`
  - Enhanced `generateSlideImageWithPuter()` with better error handling
  - Added `testImagenApiDirect()` diagnostic function
  - Added `generateSvgPlaceholder()` fallback
  
- **Improved:** Batch processing has better error reporting
- **Added:** Detailed console logging throughout image generation pipeline

## Video Walkthrough (Optional)
If you need more help, record a short video of:
1. Opening browser console
2. Running diagnostic function
3. Showing both the request and response in console

That will be enough to identify the exact issue.
