import { supabase } from "@/lib/supabaseClient";

export interface StudentStoryProgress {
  id: string;
  student_user_id: string;
  story_id: string;
  current_slide_id: string | null;
  completed: boolean;
  last_opened_at: string;
  created_at: string;
  updated_at: string;
}

export const upsertStudentStoryProgress = async (payload: {
  studentUserId: string;
  storyId: string;
  currentSlideId?: string | null;
  completed?: boolean;
}): Promise<StudentStoryProgress> => {
  const { data, error } = await supabase
    .from("student_story_progress")
    .upsert(
      {
        student_user_id: payload.studentUserId,
        story_id: payload.storyId,
        current_slide_id: payload.currentSlideId ?? null,
        completed: payload.completed ?? false,
        last_opened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_user_id,story_id" }
    )
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to save story progress");

  return data as StudentStoryProgress;
};

export const getLastOpenedStoryProgress = async (
  studentUserId: string
): Promise<StudentStoryProgress | null> => {
  const { data, error } = await supabase
    .from("student_story_progress")
    .select("*")
    .eq("student_user_id", studentUserId)
    .order("last_opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as StudentStoryProgress | null) ?? null;
};
