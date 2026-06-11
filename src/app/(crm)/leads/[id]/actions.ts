"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function leadContext(leadId: string) {
  if (!isSupabaseConfigured()) redirect(`/leads/${leadId}`);
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function redirectToLead(leadId: string, kind: "sucesso" | "erro", message: string, anchor?: string): never {
  redirect(`/leads/${leadId}?${kind}=${encodeURIComponent(message)}${anchor ? `#${anchor}` : ""}`);
}

function validBudget(rawValue: string) {
  const budget = Number(rawValue || 0);
  return Number.isFinite(budget) && budget >= 0 ? budget : null;
}

function priorityValue(formData: FormData) {
  const priority = value(formData, "priority");
  return priority === "baixa" || priority === "alta" ? priority : "media";
}

function dueAtValue(rawValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawValue)) return null;
  const parsed = new Date(`${rawValue}:00-03:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export async function updateLeadDetailsAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  const name = value(formData, "name");
  const interest = value(formData, "interest");
  const sourceId = value(formData, "source_id");
  const budget = validBudget(value(formData, "budget"));

  if (name.length < 2) redirectToLead(leadId, "erro", "Informe um nome válido.");
  if (!interest) redirectToLead(leadId, "erro", "Informe o interesse do lead.");
  if (!sourceId) redirectToLead(leadId, "erro", "Selecione a origem do lead.");
  if (budget === null) redirectToLead(leadId, "erro", "Informe um orçamento válido.");

  const { supabase, userId } = await leadContext(leadId);
  const { data: source } = await supabase
    .from("lead_sources")
    .select("id")
    .eq("id", sourceId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!source) redirectToLead(leadId, "erro", "A origem selecionada não está disponível.");

  const { data, error } = await supabase
    .from("leads")
    .update({
      name,
      email: value(formData, "email") || null,
      phone: value(formData, "phone") || null,
      city: value(formData, "city") || null,
      company: value(formData, "company") || null,
      interest,
      budget,
      preferred_contact_time: value(formData, "preferred_contact_time") || null,
      notes: value(formData, "notes") || null,
      source_id: source.id,
    })
    .eq("id", leadId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirectToLead(leadId, "erro", "Não foi possível salvar as alterações.");
  revalidateLeadPaths(leadId);
  redirectToLead(leadId, "sucesso", "Informações atualizadas.");
}

export async function updateLeadPipelineStatusAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  const statusId = value(formData, "status_id");
  const { supabase, userId } = await leadContext(leadId);
  const { data: status } = await supabase
    .from("lead_statuses")
    .select("id")
    .eq("id", statusId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!status) redirectToLead(leadId, "erro", "O status selecionado não está disponível.");

  const { data, error } = await supabase
    .from("leads")
    .update({ status_id: status.id })
    .eq("id", leadId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirectToLead(leadId, "erro", "Não foi possível atualizar o status.");
  revalidateLeadPaths(leadId);
  revalidatePath("/pipeline");
  redirectToLead(leadId, "sucesso", "Status do pipeline atualizado.");
}

export async function addLeadNoteAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  const content = value(formData, "content");
  if (!content) redirectToLead(leadId, "erro", "Escreva uma nota antes de adicionar.", "notas");
  if (content.length > 5000) redirectToLead(leadId, "erro", "A nota deve ter no máximo 5.000 caracteres.", "notas");

  const { supabase, userId } = await leadContext(leadId);
  const { error } = await supabase.from("lead_notes").insert({ owner_id: userId, lead_id: leadId, content });
  if (error) redirectToLead(leadId, "erro", "Não foi possível adicionar a nota.", "notas");

  revalidatePath(`/leads/${leadId}`);
  redirectToLead(leadId, "sucesso", "Nota adicionada.", "notas");
}

export async function createLeadFollowUpAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  const title = value(formData, "title");
  const dueAt = dueAtValue(value(formData, "due_at"));
  if (!title) redirectToLead(leadId, "erro", "Informe a atividade do follow-up.", "tarefas");
  if (title.length > 240) redirectToLead(leadId, "erro", "A atividade deve ter no máximo 240 caracteres.", "tarefas");
  if (!dueAt) redirectToLead(leadId, "erro", "Informe uma data e hora válidas.", "tarefas");

  const { supabase, userId } = await leadContext(leadId);
  const { error } = await supabase.from("lead_tasks").insert({
    owner_id: userId,
    lead_id: leadId,
    title,
    due_at: dueAt,
    priority: priorityValue(formData),
  });
  if (error) redirectToLead(leadId, "erro", "Não foi possível criar o follow-up.", "tarefas");

  revalidateLeadPaths(leadId);
  revalidatePath("/tarefas");
  redirectToLead(leadId, "sucesso", "Follow-up criado.", "tarefas");
}

export async function toggleLeadFollowUpAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  const taskId = value(formData, "task_id");
  const completed = value(formData, "completed") === "true";
  const { supabase, userId } = await leadContext(leadId);
  const { data, error } = await supabase
    .from("lead_tasks")
    .update({ completed: !completed })
    .eq("id", taskId)
    .eq("lead_id", leadId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) redirectToLead(leadId, "erro", "Não foi possível atualizar o follow-up.", "tarefas");
  revalidateLeadPaths(leadId);
  revalidatePath("/tarefas");
  redirectToLead(leadId, "sucesso", completed ? "Follow-up reaberto." : "Follow-up concluído.", "tarefas");
}

function revalidateLeadPaths(leadId: string) {
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
