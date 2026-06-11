import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import type { FollowUpTask, LeadStatus, Profile } from "@/lib/types";

export type DashboardStatus = {
  id: string;
  name: string;
  slug: LeadStatus;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
  count: number;
};

export type DashboardActivity = {
  id: string;
  action: string;
  leadId: string | null;
  leadName: string | null;
  createdAt: string;
};

export type CrmDashboardData = {
  profile: Profile;
  totalLeads: number;
  newLeadsToday: number;
  wonLeads: number;
  closedLeads: number;
  conversionRate: number;
  statuses: DashboardStatus[];
  activities: DashboardActivity[];
  upcomingTasks: FollowUpTask[];
};

export type CrmDashboardResult =
  | { state: "ready"; data: CrmDashboardData }
  | { state: "unconfigured" }
  | { state: "error"; message: string };

type Summary = {
  totalLeads: number;
  newLeadsToday: number;
  wonLeads: number;
  closedLeads: number;
  conversionRate: number;
  statuses: DashboardStatus[];
};

function isRecord(value: Json | undefined): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberValue(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function stringValue(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function booleanValue(value: Json | undefined) {
  return value === true;
}

function leadStatus(value: Json | undefined): LeadStatus | null {
  if (
    value === "novo" ||
    value === "contato-feito" ||
    value === "qualificado" ||
    value === "proposta" ||
    value === "fechado" ||
    value === "perdido"
  ) {
    return value;
  }
  return null;
}

function parseSummary(value: Json | null): Summary | null {
  const summaryRecord = value ?? undefined;
  if (!isRecord(summaryRecord)) return null;

  const statusesValue = summaryRecord.statuses;
  const statuses = Array.isArray(statusesValue)
    ? statusesValue.flatMap((item) => {
        if (!isRecord(item)) return [];
        const slug = leadStatus(item.slug);
        const id = stringValue(item.id);
        const name = stringValue(item.name);
        if (!slug || !id || !name) return [];
        return [
          {
            id,
            name,
            slug,
            color: stringValue(item.color) || "#64748b",
            position: numberValue(item.position),
            isWon: booleanValue(item.is_won),
            isLost: booleanValue(item.is_lost),
            count: numberValue(item.count),
          },
        ];
      })
    : [];

  return {
    totalLeads: numberValue(summaryRecord.total_leads),
    newLeadsToday: numberValue(summaryRecord.new_leads_today),
    wonLeads: numberValue(summaryRecord.won_leads),
    closedLeads: numberValue(summaryRecord.closed_leads),
    conversionRate: numberValue(summaryRecord.conversion_rate),
    statuses,
  };
}

export async function getCrmDashboard(): Promise<CrmDashboardResult> {
  if (!isSupabaseConfigured()) return { state: "unconfigured" };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { state: "error", message: "Sua sessão expirou. Entre novamente para acessar o dashboard." };
  }

  const now = new Date().toISOString();
  const [profileResult, summaryResult, activitiesResult, tasksResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, company_name, phone, public_form_slug")
      .eq("id", userId)
      .single(),
    supabase.rpc("get_crm_dashboard_summary", {
      client_timezone: "America/Sao_Paulo",
    }),
    supabase
      .from("activity_logs")
      .select("id, action, lead_id, created_at, lead:leads(name)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("lead_tasks")
      .select("id, owner_id, lead_id, title, due_at, completed, priority, lead:leads(id, name)")
      .eq("owner_id", userId)
      .eq("completed", false)
      .gte("due_at", now)
      .order("due_at", { ascending: true })
      .limit(5),
  ]);

  const firstError =
    profileResult.error ??
    summaryResult.error ??
    activitiesResult.error ??
    tasksResult.error;

  if (firstError) {
    return {
      state: "error",
      message: firstError.message.includes("get_crm_dashboard_summary")
        ? "A migração do dashboard ainda não foi aplicada no Supabase."
        : "Não foi possível carregar os dados do dashboard.",
    };
  }

  const summary = parseSummary(summaryResult.data);
  if (!profileResult.data || !summary) {
    return { state: "error", message: "O Supabase retornou dados incompletos para o dashboard." };
  }

  return {
    state: "ready",
    data: {
      profile: profileResult.data,
      ...summary,
      activities: (activitiesResult.data ?? []).map((activity) => ({
        id: activity.id,
        action: activity.action,
        leadId: activity.lead_id,
        leadName: activity.lead?.name ?? null,
        createdAt: activity.created_at,
      })),
      upcomingTasks: tasksResult.data ?? [],
    },
  };
}
