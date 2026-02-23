# Data Flow: Mock to Live Database

## Quick Reference Guide

### NGO Portal Data Flow

#### Dashboard
```typescript
// BEFORE
import { dashboardStats, mockStories } from "@/data/mockData";
<p>{dashboardStats.storiesCreated}</p>
{mockStories.slice(0, 5).map(story => ...)}

// AFTER
const [stories, setStories] = useState([]);
useEffect(() => {
  const data = await getUserStories(user.id);
  setStories(data);
}, [user]);
<p>{stories.length}</p>
{stories.slice(0, 5).map(story => ...)}
```

#### My Stories
```typescript
// BEFORE
import { mockStories } from "@/data/mockData";
<Link to="/ngo/story-editor">Edit</Link>
<Link to="/student/story/1">Preview</Link>

// AFTER
const [stories, setStories] = useState([]);
useEffect(() => {
  const data = await getUserStories(user.id);
  setStories(data);
}, [user]);
<Link to={`/ngo/story-editor/${story.id}`}>Edit</Link>
<Link to={`/student/story/${story.id}`}>Preview</Link>
```

#### Story Editor
```typescript
// BEFORE
const generatedStory = loadGeneratedStory(); // localStorage only
onClick={() => toast({ title: "Saved!" })} // No DB save

// AFTER
const { id } = useParams();
const story = await getStoryById(id); // Supabase
const handleSaveDraft = async () => {
  await supabase.from("stories").update({
    story_data: { ...storyData, slides }
  }).eq("id", id);
};
```

---

### Student Portal Data Flow

#### Student Home
```typescript
// BEFORE
import { studentStories } from "@/data/mockData";
{studentStories.map(story => ...)}

// AFTER
const [stories, setStories] = useState([]);
useEffect(() => {
  const data = await getPublishedStories();
  setStories(data);
}, []);
{stories.map(story => ...)}
```

#### Story Viewer
```typescript
// BEFORE
const generatedStory = loadGeneratedStory(); // localStorage only
const slides = sampleStorySlides; // fallback

// AFTER
const { id } = useParams();
const story = await getStoryById(id); // Supabase
const slides = story.story_data.slides;
```

---

## Routing Changes

### Before
```typescript
// App.tsx
<Route path="story-editor" element={<StoryEditor />} />

// Usage
<Link to="/ngo/story-editor">Edit</Link>
```

### After
```typescript
// App.tsx
<Route path="story-editor/:id" element={<StoryEditor />} />

// Usage
<Link to={`/ngo/story-editor/${story.id}`}>Edit</Link>
```

---

## Database Queries Used

### NGO Queries
```typescript
// Get all user's stories
const stories = await getUserStories(userId);

// Get single story for editing
const story = await getStoryById(storyId);

// Update story status to published
await updateStoryStatus(storyId, "published");

// Save draft changes
await supabase
  .from("stories")
  .update({ story_data: updatedData })
  .eq("id", storyId);
```

### Student Queries
```typescript
// Get all published stories
const stories = await getPublishedStories();

// Get single story for viewing
const story = await getStoryById(storyId);
```

---

## Authentication Context

All queries use authenticated user:
```typescript
const { user } = useAuth();

// NGO sees only their own stories
await getUserStories(user.id);

// Students see all published stories (RLS handles access)
await getPublishedStories();
```

---

## State Management Pattern

Every component follows this pattern:

```typescript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    const result = await fetchFunction();
    setData(result || []);
    setLoading(false);
  };
  loadData();
}, [dependencies]);

return loading ? <Loading /> : <Content data={data} />;
```

---

## Empty States

All components handle empty data gracefully:

```typescript
{loading ? (
  <p>Loading...</p>
) : data.length === 0 ? (
  <div>
    <h3>No stories yet</h3>
    <Button asChild>
      <Link to="/ngo/create-story">Create Story</Link>
    </Button>
  </div>
) : (
  data.map(item => <Card {...item} />)
)}
```

---

## Error Handling

All database operations include error handling:

```typescript
try {
  const result = await supabaseFunction();
  if (!result) {
    toast({
      title: "Not found",
      variant: "destructive"
    });
    navigate("/fallback");
    return;
  }
  // Success path
} catch (error) {
  toast({
    title: "Error",
    description: error.message,
    variant: "destructive"
  });
}
```

---

## Complete Component Structure

### Template for Data-Driven Components

```typescript
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFunction } from "@/lib/supabaseStoryService";
import { useToast } from "@/hooks/use-toast";

interface DataType {
  id: string;
  // ... other fields
}

const Component = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const result = await fetchFunction(user.id);
        setData(result || []);
      } catch (error) {
        toast({
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Render with loading/empty/data states
  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : data.length === 0 ? (
        <EmptyState />
      ) : (
        <DataView data={data} />
      )}
    </div>
  );
};

export default Component;
```

---

## Key Takeaways

### ✅ What Changed
1. All mock data imports removed
2. All components use Supabase queries
3. Dynamic routing with story IDs
4. Real-time data from database
5. Proper loading and error states

### ✅ What Stayed
1. localStorage fallbacks for development
2. UI/UX remains identical
3. Component structure preserved
4. No breaking changes to props

### ✅ Benefits
1. Real user data displayed
2. Multi-user support working
3. Data persistence across sessions
4. Edit/publish workflows functional
5. Student-NGO data separation working

---

## Testing Quick Commands

```bash
# Build to check for TypeScript errors
npm run build

# Run development server
npm run dev

# Check for linting issues
npm run lint
```

---

## Files Modified

### Core Pages
- `src/pages/ngo/Dashboard.tsx` - Live stats & recent stories
- `src/pages/ngo/MyStories.tsx` - User's story list with dynamic links
- `src/pages/ngo/StoryEditor.tsx` - Load/save stories by ID
- `src/pages/student/StudentHome.tsx` - Published stories list
- `src/pages/student/StoryViewer.tsx` - View stories by ID

### Routing
- `src/App.tsx` - Added `:id` parameter to story-editor route

### Documentation
- `SUPABASE_DATA_INTEGRATION.md` - Full migration documentation
- `DATA_FLOW_REFERENCE.md` - This quick reference guide

---

## Common Patterns Reference

### Fetch on Mount
```typescript
useEffect(() => {
  const load = async () => {
    const data = await fetchFunction();
    setData(data);
  };
  load();
}, []);
```

### User-Specific Data
```typescript
const { user } = useAuth();
useEffect(() => {
  if (user?.id) {
    loadUserData(user.id);
  }
}, [user]);
```

### Dynamic Navigation
```typescript
// Don't do this:
<Link to="/story-editor">Edit</Link>

// Do this:
<Link to={`/story-editor/${story.id}`}>Edit</Link>
```

### Empty State with CTA
```typescript
{data.length === 0 && (
  <div>
    <p>No data yet</p>
    <Button asChild>
      <Link to="/create">Create First Item</Link>
    </Button>
  </div>
)}
```

