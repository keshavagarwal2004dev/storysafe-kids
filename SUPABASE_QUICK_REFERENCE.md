# SafeStory + Supabase - Quick Reference Guide

## 🚀 Getting Started (5 minutes)

### 1. Configure Environment
```bash
# Copy .env.example to .env and fill in your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Create Database Tables
Go to Supabase Dashboard > SQL Editor and paste the SQL from `SUPABASE_SETUP.md`

### 3. Run the App
```bash
npm run dev
```

### 4. Test Authentication
- Click "NGO Login" → "Sign Up" → Create test account
- Story created will be saved to Supabase automatically
- Logout and login again → story still there ✅

### Supabase-Only Mode
- App data persistence is Supabase-only.
- No localStorage fallback is used for stories, student profiles, or role resolution.

---

## 📚 Common Tasks

### NGO: Create & Publish a Story

```
1. Sign up/login at /ngo-login
2. Click "Create Story"
3. Fill form (topic, age group, language, characters, etc.)
4. Click "Generate Story with AI"
5. Wait for Groq + Gemini completion
6. Story editor opens (automatically loaded)
7. Review/edit story
8. Click "Approve" → changes status to "published"
9. Published story visible to students
```

### Student: Read a Story

```
1. Sign up/login at /student-login
2. Fill profile (name, age group, avatar)
3. Click "Let's Go!"
4. Click story from list
5. Read slides and make choices
6. On completion → reinforcement screen
```

### Code: Save a Story Programmatically

```typescript
import { useAuth } from "@/contexts/AuthContext";
import { saveStoryToSupabase } from "@/lib/supabaseStoryService";

function MyComponent() {
  const { user } = useAuth();
  
  const handleSave = async () => {
    if (!user) return;
    
    const story = await saveStoryToSupabase(
      user.id,
      {
        title: "My Story",
        topic: "Traffic Safety",
        // ... other fields
      },
      "draft" // or "published"
    );
    
    console.log("Story saved:", story.id);
  };
}
```

---

## 🔧 API Reference

### Authentication Hook
```typescript
const {
  user,              // User object (email, id, etc.)
  session,           // Supabase session
  isAuthenticated,   // boolean
  userType,          // "ngo" | "student" | null
  isLoading,         // Loading state
  signUp,            // (email, password, userType) => Promise
  signIn,            // (email, password) => Promise
  signOut,           // () => Promise
} = useAuth();
```

### Story Service Functions
```typescript
import {
  saveStoryToSupabase,      // Create new story
  getUserStories,           // Get user's stories
  getStoryById,             // Get single story
  updateStoryStatus,        // Draft ↔ Published
  updateStoryData,          // Edit story content
  deleteStory,              // Remove story
  getPublishedStories,      // Get public stories
} from "@/lib/supabaseStoryService";

import {
  upsertStudentProfile,     // Save child profile
  getChildrenCount,         // Analytics child count
} from "@/lib/supabaseStudentProfileService";
```

---

## 🛡️ Security Checklist

- ✅ Passwords hashed by Supabase
- ✅ Sessions managed automatically
- ✅ Row Level Security (RLS) enforced
- ✅ Users only see their own drafts
- ✅ Published stories world-visible
- ✅ Anon key used (limited permissions)

---

## 📊 Database Schema Quick View

**Table**: `stories`

```sql
id (UUID)
├── user_id (FK to auth.users)
├── title (TEXT)
├── topic (TEXT)
├── age_group (TEXT)
├── language (TEXT)
├── character_count (INT)
├── region_context (TEXT)
├── description (TEXT)
├── moral_lesson (TEXT)
├── story_data (JSONB) -- Full story + slides + images
├── status (TEXT) -- 'draft' or 'published'
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Table**: `student_profiles`

```sql
id (UUID)
├── user_id (FK to auth.users, UNIQUE)
├── email (TEXT)
├── name (TEXT)
├── age_group (TEXT)
├── avatar (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

**Table**: `student_follow_up_alerts`

```sql
id (UUID)
├── ngo_user_id (FK to auth.users)
├── student_user_id (FK to auth.users)
├── student_name (TEXT)
├── story_id (FK to stories.id)
├── story_title (TEXT)
├── reason (TEXT)
├── is_resolved (BOOLEAN)
├── created_at (TIMESTAMP)
└── resolved_at (TIMESTAMP)
```

---

## 🐛 Debugging Tips

### Check Auth Session
```javascript
// In browser console
const { data } = await supabase.auth.getSession();
console.log(data.session); // Shows current session
```

### View Stories in Database
Supabase Dashboard > Database > stories > View data

### Check Logs
```bash
# Browser console - look for [SafeStory][Auth] and [SafeStory][Supabase]
# Supabase dashboard > Logs for SQL errors
```

### Test User Creation
Try signing up with: `test@example.com` / `TestPassword123`

---

## 📁 File Structure

```
src/
├── contexts/
│   └── AuthContext.tsx          ← Auth state & functions
├── lib/
│   ├── supabaseClient.ts        ← Supabase initialization
│   └── supabaseStoryService.ts  ← Story CRUD operations
├── components/
│   ├── ProtectedRoute.tsx       ← Route protection
│   └── layout/
│       ├── NGOLayout.tsx        ← NGO sidebar + logout
│       └── StudentLayout.tsx    ← Student header + logout
├── pages/
│   ├── NGOLogin.tsx             ← NGO signup/login
│   ├── StudentLogin.tsx         ← Student signup/login
│   ├── Landing.tsx              ← Homepage
│   └── ngo/
│       └── CreateStory.tsx      ← Saves to Supabase
```

---

## 🚨 Error Handling

### "Missing Supabase credentials"
→ Check `.env` file has VITE_ prefix

### "RLS policy violation"  
→ User trying to access another user's draft stories

### "User already exists"
→ Email already registered, use different email

### "Story not found"
→ Story doesn't exist or user doesn't own it

---

## 📈 Production Deployment

### Environment Variables (Required)
```
VITE_SUPABASE_URL=<your_url>
VITE_SUPABASE_ANON_KEY=<your_key>
VITE_GROQ_API_KEY=<your_groq_key>
VITE_GEMINI_API_KEY=<your_gemini_key>
```

### Monitoring
- Supabase Dashboard > Usage - track API calls
- Supabase > Storage > Auth > Users - see registered users
- Browser DevTools Console - check logs

### Rate Limiting
- Supabase Free: 50,000 monthly active users
- Monitor usage in dashboard
- Upgrade plan if approaching limits

---

## 💡 Pro Tips

1. **Bulk Export Stories**
   ```sql
   SELECT * FROM stories WHERE status = 'published';
   ```

2. **Find User by Email**
   ```typescript
   const { data } = await supabase.auth.admin.listUsers();
   const user = data.users.find(u => u.email === "test@example.com");
   ```

3. **Clear Local Session**
   ```javascript
   localStorage.removeItem('user_type_*');
   await supabase.auth.signOut();
   ```

4. **View User's Stories**
   ```typescript
   const stories = await supabase
     .from('stories')
     .select('*')
     .eq('user_id', userId);
   ```

---

## 📞 Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- Local: Check `SUPABASE_SETUP.md` for detailed setup

---

## ✅ Verification Checklist

- [ ] `.env` file created with Supabase credentials
- [ ] SQL table created in Supabase
- [ ] `npm run dev` runs without errors
- [ ] Can sign up at `/ngo-login`
- [ ] Can create story (saved to Supabase)
- [ ] Can logout and login again
- [ ] Story persists after logout/login
- [ ] Can read published stories as student
- [ ] Build succeeds: `npm run build`

---

**All set! Happy coding! 🎉**
