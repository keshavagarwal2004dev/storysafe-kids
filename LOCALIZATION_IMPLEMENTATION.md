# Multi-Language Localization Implementation

## Overview
SafeStory now supports multi-language localization across follow-up alerts and student UI. All follow-up cards and continue text are now displayed in the same language as the story.

## Languages Supported
- English
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Mandarin (普通话)
- Portuguese (Português)
- Arabic (العربية)
- **Hindi (हिन्दी)** ✨ NEW
- **Tamil (தமிழ்)** ✨ NEW
- **Bengali (বাংলা)** ✨ NEW
- **Marathi (मराठी)** ✨ NEW
- **Telugu (తెలుగు)** ✨ NEW
- **Kannada (ಕನ್ನಡ)** ✨ NEW

## Changes Made

### 1. New Translation System
**File:** `src/lib/translations.ts`

Translation utility providing:
- `getTranslation(language, key)` - Get a translated phrase
- Support for 8 languages and growing
- Automatic fallback to English if translation unavailable

**Supported phrases:**
- `continue` - Basic continue action
- `continueYourJourney` - Resume story prompt
- `readAgain` - Completed story prompt
- `unsafeChoice` - Alert reason text
- `markedAsResolved` - Toast notification
- `backToHome` - Navigation button

**Usage:**
```typescript
import { getTranslation } from "@/lib/translations";

// Get translated text
const label = getTranslation("Spanish", "continueYourJourney");
// Result: "Continúa tu viaje"
```

### 2. Follow-Up Alert Service Updates
**File:** `src/lib/supabaseFollowUpService.ts`

- Added `language` field to `FollowUpAlert` interface
- `createFollowUpAlert()` now accepts `language` parameter
- Language stored in database for each alert
- Defaults to "English" if not provided

### 3. Student Home Page
**File:** `src/pages/student/StudentHome.tsx`

**Changes:**
- Import `getTranslation` function
- "Continue your journey" → translated based on story language
- "Read again" → translated based on story language
- Button text matches story's language

**Example:**
- English story → "Continue your journey"
- Spanish story → "Continúa tu viaje"
- French story → "Continuez votre voyage"

### 4. Story Viewer
**File:** `src/pages/student/StoryViewer.tsx`

**Changes:**
- Import `getTranslation` function
- Pass story language when creating follow-up alerts
- Alert reason text stored in story's language
- "Back to Home" button translates based on story language

**Example Flow:**
1. Child reads Spanish story
2. Selects unsafe option
3. Follow-up alert created with:
   - `language: "Spanish"`
   - `reason: "El niño seleccionó una opción insegura"`
4. NGO dashboard shows Spanish reason text

### 5. NGO Dashboard
**File:** `src/pages/ngo/Dashboard.tsx`

**Changes:**
- Import `getTranslation` function
- Display language badge for non-English stories
- Show full follow-up reason text (now in story's language)
- "Marked as talked to" toast translates to story's language
- Improved alert card layout with language indicator

**Alert Card Details:**
```
Student Name [Language Badge if not English]
Story Title • Date
Unsafe choice reason (in story's language)
[Talked] or [Cross Out] button
```

### 6. Database Schema
**File:** `SUPABASE_SETUP.md`

**New Column:**
```sql
ALTER TABLE student_follow_up_alerts 
ADD COLUMN language TEXT DEFAULT 'English';
```

## How It Works

### For New Stories
1. NGO creates story in desired language (e.g., "Spanish")
2. Story saved with `language: "Spanish"`
3. When student selects unsafe choice:
   - Follow-up alert created with `language: "Spanish"`
   - Reason text: "El niño seleccionó una opción insegura"
4. NGO dashboard shows Spanish text + language badge

### For Existing Stories
If you already have stories in your database:
1. Run migration SQL to add language column to follow-up alerts table
2. Future alerts will use story's language
3. Existing alerts default to "English"

## Migration for Existing Databases

If you created the `student_follow_up_alerts` table before this update, run:

```sql
ALTER TABLE student_follow_up_alerts 
ADD COLUMN language TEXT DEFAULT 'English';

CREATE INDEX IF NOT EXISTS idx_follow_up_language 
ON student_follow_up_alerts(language);
```

## Example: Spanish Story Flow

**Student side:**
1. Logs in → StudentHome
2. Sees: "Continúa tu viaje" (instead of "Continue your journey")
3. Opens Spanish story about road safety
4. Makes wrong choice (doesn't look both ways)
5. Gets feedback, tries again

**NGO side:**
1. Dashboard shows follow-up alert with:
   - ✅ Language badge: "Spanish"
   - ✅ Reason: "El niño seleccionó una opción insegura"
   - ✅ Toast when marking resolved: "Marcado como hablado"
2. Can reach out to child in their native language

## Adding More Languages

To add support for additional languages:

1. **Update translations.ts:**
```typescript
const translations = {
  // ... existing languages
  Japanese: {
    continue: "続行",
    continueYourJourney: "あなたの旅を続けます",
    readAgain: "もう一度読む",
    unsafeChoice: "子どもが危険な選択肢を選択しました",
    markedAsResolved: "話し合ったようにマーク",
    backToHome: "ホームに戻る",
  },
};
```

2. **Language options added automatically** to story creation form
3. **No database changes needed** - language field is already flexible

## Indian Languages Support

All major Indian languages are now supported:
- **Hindi** (हिन्दी) - Most widely spoken in India
- **Tamil** (தமிழ்) - South India, Sri Lanka  
- **Bengali** (বাংলা) - East India, Bangladesh
- **Marathi** (मराठी) - Western India (Maharashtra)
- **Telugu** (తెలుగు) - South India (Andhra Pradesh, Telangana)
- **Kannada** (ಕನ್ನಡ) - South India (Karnataka)

**How it works:**
1. NGO selects "Hindi" or any Indian language when creating a story
2. Story saved with that language code
3. When children read the story:
   - "Continue your journey" → "अपनी यात्रा जारी रखें" (Hindi)
   - "Continue your journey" → "உங்கள் பயணத்தைத் தொடரவும்" (Tamil)
   - And so on for each language
4. NGO receives follow-up alerts with localized reason text:
   - Hindi: "बच्चे ने एक असुरक्षित विकल्प चुना"
   - Tamil: "குழந்தை ஒரு பாதுகாப்பற்ற தேர்வை தேர்ந்தெடுத்தது"

## Testing Multi-Language

1. Create a story in a non-English language (e.g., Spanish)
2. Sign in as student, see "Continúa tu viaje"
3. Select unsafe choice
4. Check NGO dashboard - alert shows Spanish reason + badge
5. Verify toast message is translated when resolving alert

## Compatibility

- ✅ Backwards compatible with existing stories
- ✅ No breaking changes to API
- ✅ Gracefully falls back to English
- ✅ All existing data continues to work
- ✅ Optional migration for new language support

## Future Enhancements

Possible extensions:
- [ ] Translate story content itself
- [ ] RTL language support (Arabic, Hebrew)
- [ ] User language preferences
- [ ] Auto-detect user browser language
- [ ] Additional languages (Japanese, Korean, Thai, etc.)
