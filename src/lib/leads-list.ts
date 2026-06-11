import type { Database } from "@/lib/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type LeadStatusRow = Database["public"]["Tables"]["lead_statuses"]["Row"];
type LeadSourceRow = Database["public"]["Tables"]["lead_sources"]["Row"];

export type LeadsListFilters = {
  search: string;
  status: string;
  source: string;
  order: "recentes" | "antigos";
};

export type LeadsListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string;
  budget: number;
  createdAt: string;
  status: Pick<LeadStatusRow, "id" | "name" | "slug" | "color"> | null;
  source: Pick<LeadSourceRow, "id" | "name" | "slug"> | null;
};

export type LeadsListData = {
  leads: LeadsListItem[];
  statuses: Pick<LeadStatusRow, "id" | "name" | "slug" | "color">[];
  sources: Pick<LeadSourceRow, "id" | "name" | "slug" | "active">[];
  total: number;
};

export type LeadsListResult =
  | { state: "ready"; data: LeadsListData }
  | { state: "unconfigured" }
  | { state: "error"; message: string };

export async function getSupabaseLeadsList(filters: LeadsListFilters): Promise<LeadsListResult> {
  if (!isSupabaseConfigured()) return { state: "unconfigured" };

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (claimsError || !userId) {
    return { state: "error", message: "Sua sessão expirou. Entre novamente para acessar os leads." };
  }

  const [statusesResult, sourcesResult] = await Promise.all([
    supabase
      .from("lead_statuses")
      .select("id, name, slug, color")
      .eq("owner_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("lead_sources")
      .select("id, name, slug, active")
      .eq("owner_id", userId)
      .order("name", { ascending: true }),
  ]);

  const taxonomyError = statusesResult.error ?? sourcesResult.error;
  if (taxonomyError) {
    return {
      state: "error",
      message: "Não foi possível carregar os status e as origens configuradas no Supabase.",
    };
  }

  const statuses = statusesResult.data ?? [];
  const sources = sourcesResult.data ?? [];
  const selectedStatus = filters.status
    ? statuses.find((status) => status.slug === filters.status)
    : undefined;
  const selectedSource = filters.source
    ? sources.find((source) => source.slug === filters.source)
    : undefined;

  if ((filters.status && !selectedStatus) || (filters.source && !selectedSource)) {
    return { state: "ready", data: { leads: [], statuses, sources, total: 0 } };
  }

  let query = supabase
    .from("leads")
    .select(
      "id, name, email, phone, company, interest, budget, created_at, status:lead_statuses(id, name, slug, color), source:lead_sources(id, name, slug)",
      { count: "exact" },
    )
    .eq("owner_id", userId);

  const search = sanitizeSearch(filters.search);
  if (search) {
    const pattern = `%${search}%`;
    query = query.or(`name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern}`);
  }

  if (selectedStatus) query = query.eq("status_id", selectedStatus.id);
  if (selectedSource) query = query.eq("source_id", selectedSource.id);

  const { data, count, error } = await query.order("created_at", {
    ascending: filters.order === "antigos",
  });

  if (error) {
    return {
      state: "error",
      message: "Não foi possível carregar os leads. Verifique a conexão e as migrações do Supabase.",
    };
  }

  return {
    state: "ready",
    data: {
      leads: (data ?? []).map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        interest: lead.interest,
        budget: lead.budget,
        createdAt: lead.created_at,
        status: lead.status,
        source: lead.source,
      })),
      statuses,
      sources,
      total: count ?? data?.length ?? 0,
    },
  };
}

function sanitizeSearch(value: string) {
  return value
    .trim()
    .slice(0, 100)
    .replace(/[(),%_"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
