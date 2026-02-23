import { supabase } from "@/lib/supabaseClient";

export interface FollowUpAlert {
  id: string;
  ngo_user_id: string;
  student_user_id: string;
  student_name: string;
  story_id: string;
  story_title: string;
  reason: string;
  language?: string;
  is_resolved: boolean;
  created_at: string;
  resolved_at?: string | null;
}

export const createFollowUpAlert = async (payload: {
  ngoUserId: string;
  studentUserId: string;
  studentName: string;
  storyId: string;
  storyTitle: string;
  language?: string;
  reason?: string;
}): Promise<FollowUpAlert> => {
  const { data, error } = await supabase
    .from("student_follow_up_alerts")
    .insert({
      ngo_user_id: payload.ngoUserId,
      student_user_id: payload.studentUserId,
      student_name: payload.studentName,
      story_id: payload.storyId,
      story_title: payload.storyTitle,
      language: payload.language || "English",
      reason: payload.reason || "Unsafe choice selected in story",
      is_resolved: false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Failed to create follow-up alert");

  return data as FollowUpAlert;
};

export const getNgoFollowUpAlerts = async (ngoUserId: string): Promise<FollowUpAlert[]> => {
  const { data, error } = await supabase
    .from("student_follow_up_alerts")
    .select("*")
    .eq("ngo_user_id", ngoUserId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as FollowUpAlert[];
};

export const resolveFollowUpAlert = async (alertId: string): Promise<void> => {
  const { error } = await supabase
    .from("student_follow_up_alerts")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", alertId);

  if (error) throw error;
};
