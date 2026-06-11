export type LeadStatus =
  | "novo"
  | "contato-feito"
  | "qualificado"
  | "proposta"
  | "fechado"
  | "perdido";

export type Lead = {
  id: string;
  owner_id?: string;
  assigned_user_id: string;
  status_id: string;
  source_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  company: string | null;
  interest: string;
  budget: number;
  preferred_contact_time: string | null;
  notes: string | null;
  source: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
};

export type FollowUpTask = {
  id: string;
  owner_id?: string;
  lead_id: string | null;
  title: string;
  due_at: string;
  completed: boolean;
  priority: "baixa" | "media" | "alta";
  lead?: Pick<Lead, "id" | "name"> | null;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  content: string;
  created_at: string;
};

export type LeadStatusRecord = {
  id: string;
  owner_id: string;
  name: string;
  slug: LeadStatus;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
};

export type LeadSource = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  active: boolean;
};

export type ActivityLog = {
  id: string;
  owner_id: string;
  lead_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  company_name: string;
  phone: string | null;
  public_form_slug: string;
};

export type DashboardData = {
  leads: Lead[];
  tasks: FollowUpTask[];
};
