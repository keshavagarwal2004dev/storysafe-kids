import { supabase } from "@/lib/supabaseClient";

export interface StudentProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  age_group: string;
  avatar?: string | null;
  created_at: string;
  updated_at: string;
}

export const upsertStudentProfile = async (
  profile: {
    userId: string;
    email: string;
    name: string;
    ageGroup: string;
    avatar?: string;
  }
): Promise<StudentProfile> => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .upsert(
        {
          user_id: profile.userId,
          email: profile.email,
          name: profile.name,
          age_group: profile.ageGroup,
          avatar: profile.avatar || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to save student profile");

    console.info("[SafeStory][Supabase] Student profile upserted:", profile.userId);
    return data as StudentProfile;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to upsert student profile:", error);
    throw error;
  }
};

export const getChildrenCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("student_profiles")
      .select("user_id", { count: "exact", head: true });

    if (error) throw error;
    return count ?? 0;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to fetch children count:", error);
    throw error;
  }
};

export const getStudentProfileByUserId = async (userId: string): Promise<StudentProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return (data as StudentProfile | null) ?? null;
  } catch (error) {
    console.error("[SafeStory][Supabase] Failed to fetch student profile:", error);
    throw error;
  }
};
