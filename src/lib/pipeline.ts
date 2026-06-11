import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const pipelineStatusSlugs = [
  "novo",
  "contato-feito",
  "qualificado",
  "proposta",
  "fechado",
  "perdido",
] as const;

export type PipelineStatusSlug = (typeof pipelineStatusSlugs)[number];

export type PipelineStatus = {
  id: string;
  name: string;
  slug: PipelineStatusSlug;
  color: string;
  position: number;
  isWon: boolean;
  isLost: boolean;
};

export type PipelineLead = {
  id: string;
  statusId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string;
  budget: number;
  updatedAt: string;
};

export type SalesPipelineData = {
  statuses: PipelineStatus[];
  leads: PipelineLead[];
};

export type SalesPipelineResult =
  | { state: "ready"; data: SalesPipelineData }
  | { state: "unconfigured" }
  | { state: "migration_required" }
  | { state: "error"; message: string };

export async function getSalesPipeline(): Promise<SalesPipelineResult> {
  if (!isSupabaseConfigured()) return { state: "unconfigured" };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { state: "error", message: "Sua sessão expirou. Entre novamente para acessar o pipeline." };
  }

  const { data: statusRows, error: statusesError } = await supabase
    .from("lead_statuses")
    .select("id, name, slug, color, position, is_won, is_lost")
    .eq("owner_id", userId)
    .in("slug", [...pipelineStatusSlugs]);

  if (statusesError) {
    return { state: "error", message: "Não foi possível carregar as etapas do pipeline." };
  }

  const statusesBySlug = new Map((statusRows ?? []).map((status) => [status.slug, status]));
  const statuses = pipelineStatusSlugs.flatMap((slug) => {
    const status = statusesBySlug.get(slug);
    if (!status) return [];
    return [{
      id: status.id,
      name: status.name,
      slug,
      color: status.color,
      position: status.position,
      isWon: status.is_won,
      isLost: status.is_lost,
    }];
  });

  if (statuses.length !== pipelineStatusSlugs.length) return { state: "migration_required" };

  const { data: leadRows, error: leadsError } = await supabase
    .from("leads")
    .select("id, status_id, name, email, phone, company, interest, budget, updated_at")
    .eq("owner_id", userId)
    .in("status_id", statuses.map((status) => status.id))
    .order("updated_at", { ascending: false });

  if (leadsError) {
    return { state: "error", message: "Não foi possível carregar os leads do pipeline." };
  }

  return {
    state: "ready",
    data: {
      statuses,
      leads: (leadRows ?? []).map((lead) => ({
        id: lead.id,
        statusId: lead.status_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        interest: lead.interest,
        budget: lead.budget,
        updatedAt: lead.updated_at,
      })),
    },
  };
}

export function isPipelineStatusSlug(value: string): value is PipelineStatusSlug {
  return pipelineStatusSlugs.some((slug) => slug === value);
}
