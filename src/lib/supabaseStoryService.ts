import { supabase } from "@/lib/supabaseClient";
import { GeneratedStory } from "@/lib/generatedStoryStorage";

export interface StoredStory {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  age_group: string;
  language: string;
  character_count: number;
  region_context: string;
  description: string;
  moral_lesson?: string;
  story_data: GeneratedStory; // Full story JSON
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
}

// Save a story to Supabase
export const saveStoryToSupabase = async (
  userId: string,
  story: GeneratedStory & {
    topic: string;
    ageGroup: string;
    language: string;
    characterCount: number;
    regionContext: string;
    description: string;
    moralLesson?: string;
  },
  status: "draft" | "published" = "draft"
): Promise<StoredStory> => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .insert([
        {
          user_id: userId,
          title: story.title,
          topic: story.topic,
          age_group: story.ageGroup,
          language: story.language,
          character_count: story.characterCount,
          region_context: story.regionContext,
          description: story.description,
          moral_lesson: story.moralLesson,
          story_data: story,
          status: status,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to save story");

    console.info("[SafeStory][Supabase] Story saved:", data.id);
    return data as StoredStory;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to save story:", error);
    throw error;
  }
};

// Get all stories for a user
export const getUserStories = async (userId: string): Promise<StoredStory[]> => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.info(`[SafeStory][Supabase] Retrieved ${data?.length || 0} stories for user`);
    return (data || []) as StoredStory[];
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to get user stories:", error);
    throw error;
  }
};

// Get a single story by ID
export const getStoryById = async (storyId: string): Promise<StoredStory> => {
  try {
    const { data, error } = await supabase.from("stories").select("*").eq("id", storyId).single();

    if (error) throw error;
    if (!data) throw new Error("Story not found");

    console.info("[SafeStory][Supabase] Retrieved story:", storyId);
    return data as StoredStory;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to get story:", error);
    throw error;
  }
};

// Update story status (draft to published)
export const updateStoryStatus = async (
  storyId: string,
  status: "draft" | "published"
): Promise<StoredStory> => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", storyId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update story");

    console.info(`[SafeStory][Supabase] Story ${storyId} updated to ${status}`);
    return data as StoredStory;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to update story status:", error);
    throw error;
  }
};

// Update story data (edit slides, images, etc.)
export const updateStoryData = async (storyId: string, storyData: GeneratedStory): Promise<StoredStory> => {
  try {
    const { data, error } = await supabase
      .from("stories")
      .update({
        story_data: storyData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storyId)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update story data");

    console.info("[SafeStory][Supabase] Story data updated:", storyId);
    return data as StoredStory;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to update story data:", error);
    throw error;
  }
};

// Delete a story
export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const { error } = await supabase.from("stories").delete().eq("id", storyId);

    if (error) throw error;

    console.info("[SafeStory][Supabase] Story deleted:", storyId);
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to delete story:", error);
    throw error;
  }
};

// Get published stories (for students)
export const getPublishedStories = async (filters?: {
  topic?: string;
  ageGroup?: string;
  language?: string;
}): Promise<StoredStory[]> => {
  try {
    let query = supabase.from("stories").select("*").eq("status", "published");

    if (filters?.topic) query = query.eq("topic", filters.topic);
    if (filters?.ageGroup) query = query.eq("age_group", filters.ageGroup);
    if (filters?.language) query = query.eq("language", filters.language);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    console.info(`[SafeStory][Supabase] Retrieved ${data?.length || 0} published stories`);
    return (data || []) as StoredStory[];
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to get published stories:", error);
    throw error;
  }
};
