import type { FollowUpTask } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type TaskLeadOption = {
  id: string;
  name: string;
};

export type TasksPageData = {
  tasks: FollowUpTask[];
  leads: TaskLeadOption[];
};

export type TasksPageResult =
  | { state: "ready"; data: TasksPageData }
  | { state: "unconfigured" }
  | { state: "error"; message: string };

export async function getTasksPageData(): Promise<TasksPageResult> {
  if (!isSupabaseConfigured()) return { state: "unconfigured" };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { state: "error", message: "Sua sessão expirou. Entre novamente para acessar as tarefas." };
  }

  const [tasksResult, leadsResult] = await Promise.all([
    supabase
      .from("lead_tasks")
      .select("id, owner_id, lead_id, title, due_at, completed, priority, lead:leads(id, name)")
      .eq("owner_id", userId)
      .order("completed", { ascending: true })
      .order("due_at", { ascending: true }),
    supabase
      .from("leads")
      .select("id, name")
      .eq("owner_id", userId)
      .order("name", { ascending: true }),
  ]);

  const firstError = tasksResult.error ?? leadsResult.error;
  if (firstError) {
    return { state: "error", message: "Não foi possível carregar as tarefas e os leads do Supabase." };
  }

  return {
    state: "ready",
    data: {
      tasks: tasksResult.data ?? [],
      leads: leadsResult.data ?? [],
    },
  };
}
