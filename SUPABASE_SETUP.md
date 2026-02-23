# SafeStory - Supabase Setup & Integration Guide

## Overview

SafeStory now uses Supabase as the backend for:
- **User Authentication**: NGO and Student signup/login
- **Story Storage**: Persistent story database with full CRUD operations
- **User Management**: Session handling and user-type differentiation

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details and create (Free tier available)
5. Wait for project initialization

### 2. Get Your Credentials

1. In your Supabase dashboard, go to **Settings > API**
2. Copy:
   - **Project URL** (e.g., `https://qmookqvwgzhbjxqijvlk.supabase.co`)
   - **Anon Key** (starts with `sb_publishable_...`)

### 3. Configure Environment Variables

Update `.env` in your project:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Example:
```env
VITE_SUPABASE_URL=https://qmookqvwgzhbjxqijvlk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_izkNwBzX8eESF1WMDv9lsw_v5sS_r3V
```

### 4. Create Database Tables

Go to **Supabase Dashboard > SQL Editor** and run the following SQL:

```sql
-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Story metadata
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  age_group TEXT NOT NULL,
  language TEXT NOT NULL,
  character_count INTEGER NOT NULL,
  region_context TEXT NOT NULL,
  description TEXT NOT NULL,
  moral_lesson TEXT,
  
  -- Story content (full JSON)
  story_data JSONB NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- Indexes for fast queries
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Enable Row Level Security
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own stories
CREATE POLICY "Users can only access their own stories" ON stories
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own stories" ON stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own stories" ON stories
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own stories" ON stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow public read of published stories (for students)
CREATE POLICY "Anyone can read published stories" ON stories
  FOR SELECT
  USING (status = 'published');

-- Create student profiles table (children data)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_age_group ON student_profiles(age_group);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own profile" ON student_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON student_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON student_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Students can delete own profile" ON student_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- NGOs can read aggregated children data (e.g., analytics counts)
CREATE POLICY "Authenticated users can read student profiles" ON student_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create follow-up alerts table (wrong decisions for NGO follow-up)
CREATE TABLE IF NOT EXISTS student_follow_up_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  story_title TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Unsafe choice selected in story',
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_follow_up_ngo_user_id ON student_follow_up_alerts(ngo_user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_student_user_id ON student_follow_up_alerts(student_user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_resolved ON student_follow_up_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_follow_up_created_at ON student_follow_up_alerts(created_at);

ALTER TABLE student_follow_up_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own follow-up alerts" ON student_follow_up_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Students can read own follow-up alerts" ON student_follow_up_alerts
  FOR SELECT
  USING (auth.uid() = student_user_id);

CREATE POLICY "NGOs can read own follow-up alerts" ON student_follow_up_alerts
  FOR SELECT
  USING (auth.uid() = ngo_user_id);

CREATE POLICY "NGOs can update own follow-up alerts" ON student_follow_up_alerts
  FOR UPDATE
  USING (auth.uid() = ngo_user_id);

-- Create student story progress table (linear continue experience)
CREATE TABLE IF NOT EXISTS student_story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_slide_id TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_user_id, story_id)
);

CREATE INDEX IF NOT EXISTS idx_story_progress_student_id ON student_story_progress(student_user_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_story_id ON student_story_progress(story_id);
CREATE INDEX IF NOT EXISTS idx_story_progress_last_opened ON student_story_progress(last_opened_at);

ALTER TABLE student_story_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read own story progress" ON student_story_progress
  FOR SELECT
  USING (auth.uid() = student_user_id);

CREATE POLICY "Students can insert own story progress" ON student_story_progress
  FOR INSERT
  WITH CHECK (auth.uid() = student_user_id);

CREATE POLICY "Students can update own story progress" ON student_story_progress
  FOR UPDATE
  USING (auth.uid() = student_user_id);
```

### 5. Test the Setup

1. Start the dev server: `npm run dev`
2. Go to http://localhost:5173
3. Click "NGO Login" → "Sign Up"
4. Create an NGO account
5. Create a story (it will be saved to Supabase)
6. Go back and log out
7. Try signing in with the same account

## Architecture

### Authentication Flow

```
User → SignUp/SignIn → Supabase Auth → Session Created
                                    ↓
                        AuthContext stores user + userType
                                    ↓
                        Protected routes check auth
                                    ↓
                        Redirect to login if not authenticated
```

### Story Storage Flow

```
NGO Form Input
    ↓
Groq AI Generation (blueprint + tree)
    ↓
Gemini Image Generation
    ↓
saveStoryToSupabase(userId, story, "draft")
    ↓
Supabase Database
```

### Supabase-Only Persistence

- Stories and student profiles are stored in Supabase only.
- There is no localStorage fallback for auth role, profile, or story content.
- If a record is missing in Supabase, the UI shows an error/empty state instead of loading local data.

### Publishing Flow

```
Story in Editor (draft status)
    ↓
NGO clicks "Approve"
    ↓
updateStoryStatus(storyId, "published")
    ↓
Story visible to students
```

## Key Files

### Authentication
- `src/contexts/AuthContext.tsx` - Auth context with signup/login/logout
- `src/pages/NGOLogin.tsx` - NGO signup/login page
- `src/pages/StudentLogin.tsx` - Student signup/login page
- `src/components/ProtectedRoute.tsx` - Route protection component

### Database
- `src/lib/supabaseClient.ts` - Supabase client initialization
- `src/lib/supabaseStoryService.ts` - Story CRUD operations

### Updated Components
- `src/App.tsx` - AuthProvider wrapper + protected routes
- `src/pages/ngo/CreateStory.tsx` - Saves to Supabase
- `src/components/layout/NGOLayout.tsx` - Logout button
- `src/components/layout/StudentLayout.tsx` - Logout button

## API Functions

### Authentication (`useAuth` hook)

```typescript
const {
  user,                    // Current user object
  session,                 // Auth session
  isLoading,              // Loading state
  isAuthenticated,        // Boolean
  userType,               // 'ngo' | 'student' | null
  signUp,                 // (email, password, userType) => Promise
  signIn,                 // (email, password) => Promise
  signOut,                // () => Promise
} = useAuth();
```

### Story Service

```typescript
// Save new story
await saveStoryToSupabase(userId, story, "draft")

// Get user's stories
await getUserStories(userId)

// Get single story
await getStoryById(storyId)

// Update story status
await updateStoryStatus(storyId, "published")

// Update story content
await updateStoryData(storyId, updatedStory)

// Delete story
await deleteStory(storyId)

// Get published stories (for students)
await getPublishedStories({ topic?, ageGroup?, language? })
```

## Security

### Row Level Security (RLS)

- Users can only **read/edit/delete** stories they own
- Published stories are readable by all (for students)
- Authenticated users only

### Environment Variables

- **VITE_SUPABASE_URL** - Public (safe to expose)
- **VITE_SUPABASE_ANON_KEY** - Anon key (safe, limited permissions)
- Never use service role key in frontend code

### Authentication

- Supabase handles password hashing & storage
- Email verification available (optional)
- Sessions stored in browser automatically

## Troubleshooting

### "Missing Supabase credentials" Error

- Check `.env` file contains both variables
- Variables must start with `VITE_` to be exposed to frontend
- Restart dev server after changing `.env`

### Sign up fails with "User already exists"

- Email is already registered
- Use a different email
- Users table is per-project (isolated)

### Stories not visible in Editor

- Make sure you're signed in
- Story must be saved by the logged-in user
- Check browser console for errors

### SQL Error when creating table

- Make sure you're in the right Supabase project
- RLS might need to be disabled temporarily: `ALTER TABLE stories DISABLE ROW LEVEL SECURITY;`
- Check table column names match exactly

## Next Steps

### Recommended Enhancements

1. **Email Verification**
   - Supabase > Auth > Settings > Email Confirmation
   - Updates auth user metadata

2. **User Profiles**
   - Create `ngo_profiles` and `student_profiles` tables
   - Store additional user info (org name, avatar, etc.)

3. **Story Sharing**
   - Add `shared_with` JSONB column to stories
   - Allow NGOs to share stories with other NGOs

4. **Analytics**
   - Log student story interactions
   - Track completion rates and decision patterns

5. **Rate Limiting**
   - Add middleware to limit API calls
   - Protect Groq/Gemini API usage

## Monitoring

### Useful Supabase Dashboard Views

- **Auth > Users** - See all registered users
- **Database > Tables > stories** - View all stored stories
- **Database > Logs** - See SQL query logs
- **API > Usage** - Monitor API requests

## Support

For Supabase issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
- [Discord Community](https://discord.supabase.com)

For SafeStory issues:
- Check browser console for error messages
- Look in Supabase logs for database errors
- Verify `.env` variables are set correctly
