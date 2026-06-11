import { cache } from "react";
import {
  demoLeads,
  demoNotes,
  demoProfile,
  demoTasks,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";
import type { FollowUpTask, Lead, LeadNote, LeadStatus, Profile } from "@/lib/types";

export type PublicForm = {
  slug: string;
  title: string;
  subtitle: string;
  company_name: string;
};

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadWithRelations = LeadRow & {
  status: { slug: string } | null;
  source: { name: string } | null;
};

const leadSelect = `
  id,
  owner_id,
  assigned_user_id,
  status_id,
  source_id,
  name,
  email,
  phone,
  city,
  company,
  interest,
  budget,
  preferred_contact_time,
  notes,
  created_at,
  updated_at,
  status:lead_statuses!leads_status_id_fkey(slug),
  source:lead_sources!leads_source_id_fkey(name)
`;

function parseLeadStatus(value: string | undefined): LeadStatus {
  switch (value) {
    case "novo":
    case "contato-feito":
    case "qualificado":
    case "proposta":
    case "fechado":
    case "perdido":
      return value;
    default:
      return "novo";
  }
}

function mapLead(row: LeadWithRelations): Lead {
  return {
    id: row.id,
    owner_id: row.owner_id,
    assigned_user_id: row.assigned_user_id,
    status_id: row.status_id,
    source_id: row.source_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    company: row.company,
    interest: row.interest,
    budget: row.budget,
    preferred_contact_time: row.preferred_contact_time,
    notes: row.notes,
    source: row.source?.name ?? "Não informada",
    status: parseLeadStatus(row.status?.slug),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const getCurrentProfile = cache(async (): Promise<Profile> => {
  if (!isSupabaseConfigured()) return demoProfile;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return demoProfile;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, phone, public_form_slug")
    .eq("id", userId)
    .single();

  return data ?? { ...demoProfile, id: userId };
});

export async function getLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return demoLeads;
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(leadSelect)
    .order("updated_at", { ascending: false });
  return data?.map(mapLead) ?? [];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!isSupabaseConfigured()) {
    return demoLeads.find((lead) => lead.id === id) ?? demoLeads[0];
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select(leadSelect)
    .eq("id", id)
    .maybeSingle();
  return data ? mapLead(data) : null;
}

export async function getTasks(): Promise<FollowUpTask[]> {
  if (!isSupabaseConfigured()) return demoTasks;
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_tasks")
    .select("*, lead:leads(id, name)")
    .order("due_at", { ascending: true });
  return data ?? [];
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  if (!isSupabaseConfigured()) {
    const notes = demoNotes.filter((note) => note.lead_id === leadId);
    return notes.length ? notes : demoNotes;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_notes")
    .select("id, lead_id, content, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLeadTasks(leadId: string): Promise<FollowUpTask[]> {
  const tasks = await getTasks();
  return tasks.filter((task) => task.lead_id === leadId);
}

export async function getPublicForm(slug: string): Promise<PublicForm | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_forms")
    .select("slug, title, subtitle, company_name")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  return data;
}
