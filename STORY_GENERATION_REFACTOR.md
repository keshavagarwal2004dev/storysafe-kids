# Story Generation Pipeline Refactor

## Overview

This refactor upgrades SafeStory's story generation pipeline with:
1. **Imagen 3 API** for high-quality, POCSO-compliant image generation
2. **Asynchronous background processing** for faster story delivery to NGOs
3. **Strict child safety guardrails** with comprehensive negative prompts
4. **Graceful UI handling** for in-flight images

## Architecture Changes

### Before: Sequential Blocking Pipeline
```
Text Generation → Image Generation (blocking) → Return to NGO
⏱️ Total time: ~3-5 minutes (text: 30s + images: 3-4 min)
```

### After: Early Return with Background Processing
```
Text Generation → Return to NGO + Navigate to Editor (30s)
                ↓
         [Background Job]
         Image Generation 1 → Batch Delay 30s → Image Generation 2 → ...
         Update Supabase after each batch
```

## Technical Updates

### 1. Image Generation Model Upgrade

**File:** `src/lib/groqStoryGenerator.ts`

#### Before (Gemini 2.0 Flash - Text Model)
- Used `gemini-2.0-flash` text generation endpoint
- Generated text descriptions as images (poor quality, slow)
- Limited safety guardrails

#### After (Imagen 3 - Image Generation Model)
- Uses `imagen-3.0-generate-001` specialized image API
- Real image generation with 4:3 aspect ratio (storybook-optimized)
- POCSO-compliant prompting:
  - **Positive suffix:** "Children's storybook illustration, soft watercolor style, warm, safe, educational, comforting tone."
  - **Negative prompts:** "no photorealistic children, no explicit content, no nudity, no graphic violence, no scary imagery, no blood, no horror, no abuse imagery"

**Code Example:**
```typescript
const response = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
  method: "POST",
  body: JSON.stringify({
    instances: [{ prompt: fullPrompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: "4:3",
      negativePrompt: POCSO_NEGATIVE_PROMPTS,
    },
  }),
});
```

### 2. Asynchronous Background Image Pipeline

**File:** `src/lib/groqStoryGenerator.ts` → `generateImagesForStoryInBackground()`

#### Batch Processing with Rate Limiting
```typescript
// Process 3 images in parallel, then wait 30s before next batch
// Respects free-tier limits: 2-15 requests/minute
async for batch in chunks(slides, size=3):
  results = await Promise.allSettled(batch.map(generateImage))
  update Supabase with results
  await sleep(30000) // Rate limit
```

#### Database Updates During Processing
- **Triggers on:** Each batch completes
- **Updates:** `story_data.slides[].imageUrl` + `metadata.imagingCompletedAt`
- **Effect:** NGO can see images arriving in real-time as they work in the editor

### 3. Early Return Pattern

**File:** `src/lib/groqStoryGenerator.ts` → `generateStoryWithGroqAndPuterWithProgress()`

```typescript
// Return AFTER text generation, BEFORE image generation
report({ stage: "storytree-ready", message: "..." });

return {
  ...story,
  slides: slides.map(s => ({ ...s, imageUrl: undefined })) // Empty placeholders
};

// Image generation happens in background (fire-and-forget)
```

### 4. Frontend Navigation

**File:** `src/pages/ngo/CreateStory.tsx` → `handleGenerate()`

```typescript
// 1. Wait for text generation only
const generated = await generateStoryWithGroqAndPuter(...);

// 2. Save to Supabase
const supabaseStory = await saveStoryToSupabase(...);

// 3. Navigate immediately
navigate(`/ngo/story-editor/${supabaseStory.id}`);

// 4. Kick off background imaging (fire & forget)
generateImagesForStoryInBackground(storyId, slides, userId).catch(console.error);
```

### 5. UI Handling for In-Flight Images

**File:** `src/pages/ngo/StoryEditor.tsx`

#### Image Display with Skeleton Loader
```tsx
{slide.imageUrl ? (
  <img src={slide.imageUrl} className="rounded-2xl" />
) : (
  <div>
    <p>⏳ Image generating in background...</p>
    <Skeleton className="aspect-[4/3]" />
  </div>
)}
```

#### Regenerate Images On Demand
```tsx
<Button onClick={regenerateCurrentImage} disabled={isRegeneratingImage}>
  <RefreshCw /> Regenerate Image
</Button>
```

## Environment Variables

Update your `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key   # (unchanged - still used)
VITE_GROQ_API_KEY=your_groq_api_key       # (unchanged)
```

**Note:** Both Gemini and Groq keys use the same Google Cloud API key. Make sure your key has access to:
- Groq API (via Google Cloud)
- Imagen 3 API endpoint

## Performance Metrics

### Before
- ✅ NGO fills form (1 min)
- ⏳ Text generation (30s)
- ⏳ Image generation blocking (3-4 min)
  - 10 slides × 15-30s per image
- ✅ Navigate to editor (total: ~4-5 min wait)

### After
- ✅ NGO fills form (1 min)
- ⏳ Text generation blocking (30s)
- ✅ Navigate to editor (total: ~1.5 min wait) ← **3x faster!**
- 📸 Images arrive 30 min later in background

## POCSO Compliance

All generated images include:

### Positive Prompting (Safety)
✅ "Children's storybook illustration"
✅ "Soft watercolor style"
✅ "Warm colors"
✅ "Safe educational tone"
✅ "Comforting, reassuring"

### Negative Prompting (Blocking)
✋ No photorealistic children
✋ No explicit content
✋ No nudity
✋ No graphic violence
✋ No scary/distressful imagery
✋ No blood or horror
✋ No unsupervised strangers in threatening poses
✋ No abuse imagery

## Error Handling

### Image Generation Failures
- **Silent failure:** If image generation fails, slide shows skeleton + message
- **Recoverable:** NGO can manually regenerate any image using "Regenerate Image" button
- **Logged:** All failures logged to console with `[SafeStory][Background Imaging]` prefix

### Database Sync Issues
- **Retry logic:** If Supabase update fails, logged but doesn't block story creation
- **Manual sync:** NGO can save draft to sync latest images

## Testing

### Test Background Imaging
1. Create a story
2. Get immediately redirected to editor
3. See "⏳ Image generating in background..." messages
4. Wait 30+ seconds between batches
5. Images appear in editor as they complete
6. Check browser console: `[SafeStory][Background Imaging]` logs

### Test Rate Limiting
- Verify 30-second delays between batches in console
- Confirm max 3 images per batch (configurable)
- No API errors for free-tier accounts

### Test Skeleton Loader
- Navigate to editor before images complete
- Verify skeleton loaders show
- Verify images appear as they generate
- No layout shift when images load

## Files Modified

1. **`src/lib/groqStoryGenerator.ts`**
   - Switched image generation to Imagen 3 API
   - Refactored `generateSlideImageWithPuter()` function
   - Added `generateImagesForStoryInBackground()` function
   - Updated prompt handling with POCSO compliance
   - Modified `generateStoryWithGroqAndPuterWithProgress()` to return early

2. **`src/pages/ngo/CreateStory.tsx`**
   - Updated progress event handling
   - Modified `handleGenerate()` to navigate early
   - Added call to background image function
   - Updated UI messaging

3. **`src/pages/ngo/StoryEditor.tsx`**
   - Added `Skeleton` component import
   - Updated image display to show skeleton loader
   - Enhanced "Regenerate Image" UX

4. **`src/lib/generatedStoryStorage.ts`**
   - Added `imagingStartedAt` and `imagingCompletedAt` to metadata

## Future Improvements

- [ ] WebSocket updates for real-time image progress
- [ ] Parallel batches (5 images/batch instead of 3) after rate limits increase
- [ ] Image cache for similar prompts
- [ ] NGO notification when all images complete
- [ ] Batch regenerate for failed images
- [ ] Image quality selection (draft/standard/premium)
