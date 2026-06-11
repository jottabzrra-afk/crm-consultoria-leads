import type { Database, Json } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type LeadStatus = Pick<
  Database["public"]["Tables"]["lead_statuses"]["Row"],
  "id" | "name" | "slug" | "color" | "position" | "is_won" | "is_lost"
>;

type LeadSource = Pick<
  Database["public"]["Tables"]["lead_sources"]["Row"],
  "id" | "name" | "slug" | "active"
>;

export type LeadDetailRecord = Pick<
  Database["public"]["Tables"]["leads"]["Row"],
  | "id"
  | "name"
  | "email"
  | "phone"
  | "city"
  | "company"
  | "interest"
  | "budget"
  | "preferred_contact_time"
  | "notes"
  | "status_id"
  | "source_id"
  | "created_at"
  | "updated_at"
> & {
  status: Omit<LeadStatus, "position" | "is_won" | "is_lost"> | null;
  source: Omit<LeadSource, "active"> | null;
};

export type LeadDetailNote = Pick<
  Database["public"]["Tables"]["lead_notes"]["Row"],
  "id" | "content" | "created_at"
>;

export type LeadDetailTask = Pick<
  Database["public"]["Tables"]["lead_tasks"]["Row"],
  "id" | "title" | "due_at" | "completed" | "priority" | "created_at" | "updated_at"
>;

export type LeadActivity = {
  id: string;
  type: "created" | "updated" | "status" | "note" | "task" | "task_completed" | "other";
  title: string;
  description: string | null;
  createdAt: string;
};

export type LeadDetailData = {
  lead: LeadDetailRecord;
  statuses: LeadStatus[];
  sources: LeadSource[];
  notes: LeadDetailNote[];
  tasks: LeadDetailTask[];
  activities: LeadActivity[];
};

export type LeadDetailResult =
  | { state: "ready"; data: LeadDetailData }
  | { state: "unconfigured" }
  | { state: "not_found" }
  | { state: "error"; message: string };

export async function getSupabaseLeadDetail(leadId: string): Promise<LeadDetailResult> {
  if (!isSupabaseConfigured()) return { state: "unconfigured" };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { state: "error", message: "Sua sessão expirou. Entre novamente para acessar este lead." };
  }

  const [leadResult, statusesResult, sourcesResult, notesResult, tasksResult, logsResult] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, name, email, phone, city, company, interest, budget, preferred_contact_time, notes, status_id, source_id, created_at, updated_at, status:lead_statuses(id, name, slug, color), source:lead_sources(id, name, slug)",
      )
      .eq("owner_id", userId)
      .eq("id", leadId)
      .maybeSingle(),
    supabase
      .from("lead_statuses")
      .select("id, name, slug, color, position, is_won, is_lost")
      .eq("owner_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("lead_sources")
      .select("id, name, slug, active")
      .eq("owner_id", userId)
      .order("name", { ascending: true }),
    supabase
      .from("lead_notes")
      .select("id, content, created_at")
      .eq("owner_id", userId)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false }),
    supabase
      .from("lead_tasks")
      .select("id, title, due_at, completed, priority, created_at, updated_at")
      .eq("owner_id", userId)
      .eq("lead_id", leadId)
      .order("completed", { ascending: true })
      .order("due_at", { ascending: true }),
    supabase
      .from("activity_logs")
      .select("id, action, metadata, created_at")
      .eq("owner_id", userId)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const firstError =
    leadResult.error ??
    statusesResult.error ??
    sourcesResult.error ??
    notesResult.error ??
    tasksResult.error ??
    logsResult.error;

  if (firstError) {
    return { state: "error", message: "Não foi possível carregar todos os dados deste lead." };
  }

  if (!leadResult.data) return { state: "not_found" };

  const statuses = statusesResult.data ?? [];
  const notes = notesResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const statusNames = new Map(statuses.map((status) => [status.id, status.name]));
  const logActivities = (logsResult.data ?? []).map((log) =>
    activityFromLog(log.id, log.action, log.metadata, log.created_at, statusNames),
  );
  const noteActivities: LeadActivity[] = notes.map((note) => ({
    id: `note-${note.id}`,
    type: "note",
    title: "Nota adicionada",
    description: truncate(note.content, 150),
    createdAt: note.created_at,
  }));
  const taskActivities: LeadActivity[] = tasks.flatMap((task) => {
    const created: LeadActivity = {
      id: `task-${task.id}`,
      type: "task",
      title: "Follow-up criado",
      description: task.title,
      createdAt: task.created_at,
    };
    if (!task.completed) return [created];
    return [
      created,
      {
        id: `task-completed-${task.id}`,
        type: "task_completed",
        title: "Follow-up concluído",
        description: task.title,
        createdAt: task.updated_at,
      },
    ];
  });

  return {
    state: "ready",
    data: {
      lead: leadResult.data,
      statuses,
      sources: sourcesResult.data ?? [],
      notes,
      tasks,
      activities: [...logActivities, ...noteActivities, ...taskActivities]
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, 50),
    },
  };
}

function activityFromLog(
  id: string,
  action: string,
  metadata: Json,
  createdAt: string,
  statusNames: Map<string, string>,
): LeadActivity {
  const details = jsonRecord(metadata);
  if (action === "lead_created") {
    return { id, type: "created", title: "Lead adicionado ao CRM", description: null, createdAt };
  }
  if (action === "lead_status_changed") {
    const previousStatus = statusName(details.previous_status_id, statusNames);
    const currentStatus = statusName(details.status_id, statusNames);
    return {
      id,
      type: "status",
      title: "Status do pipeline atualizado",
      description: previousStatus && currentStatus ? `${previousStatus} → ${currentStatus}` : currentStatus,
      createdAt,
    };
  }
  if (action === "lead_updated") {
    return { id, type: "updated", title: "Informações do lead atualizadas", description: null, createdAt };
  }
  return { id, type: "other", title: "Atividade registrada", description: null, createdAt };
}

function jsonRecord(value: Json): { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}

function statusName(value: Json | undefined, statuses: Map<string, string>) {
  return typeof value === "string" ? statuses.get(value) ?? null : null;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1).trim()}…` : value;
}
