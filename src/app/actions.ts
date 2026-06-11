"use server";

import { createClient as createPublicClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { leadStatusLabels } from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function taskPriority(formData: FormData) {
  const priority = value(formData, "priority");
  return priority === "baixa" || priority === "alta" ? priority : "media";
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Sessão expirada.");
  return { supabase, userId };
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  if (error) redirect(`/login?erro=${encodeURIComponent("E-mail ou senha inválidos.")}`);
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: value(formData, "email"),
    password: value(formData, "password"),
    options: {
      data: {
        full_name: value(formData, "full_name"),
        company_name: value(formData, "company_name"),
      },
    },
  });
  if (error) redirect(`/cadastro?erro=${encodeURIComponent(error.message)}`);
  redirect(`/login?mensagem=${encodeURIComponent("Conta criada. Verifique seu e-mail para confirmar o acesso.")}`);
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

export async function createLeadAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/leads?modo=demo");
  const { supabase, userId } = await authenticatedClient();
  const sourceName = value(formData, "source") || "Cadastro manual";
  const sourceSlug = slugify(sourceName);

  const [{ data: status }, { data: existingSource }] = await Promise.all([
    supabase
      .from("lead_statuses")
      .select("id")
      .eq("owner_id", userId)
      .eq("slug", "novo")
      .single(),
    supabase
      .from("lead_sources")
      .select("id")
      .eq("owner_id", userId)
      .eq("slug", sourceSlug)
      .maybeSingle(),
  ]);

  if (!status) redirect(`/leads?erro=${encodeURIComponent("Status inicial não configurado.")}`);

  let sourceId = existingSource?.id;
  if (!sourceId) {
    const { data: createdSource, error: sourceError } = await supabase
      .from("lead_sources")
      .insert({ owner_id: userId, name: sourceName, slug: sourceSlug })
      .select("id")
      .single();
    if (sourceError) redirect(`/leads?erro=${encodeURIComponent(sourceError.message)}`);
    sourceId = createdSource.id;
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      owner_id: userId,
      assigned_user_id: userId,
      status_id: status.id,
      source_id: sourceId,
      name: value(formData, "name"),
      email: value(formData, "email") || null,
      phone: value(formData, "phone") || null,
      city: value(formData, "city") || null,
      company: value(formData, "company") || null,
      interest: value(formData, "interest"),
      budget: Number(value(formData, "budget") || 0),
      notes: value(formData, "notes") || null,
    })
    .select("id")
    .single();
  if (error) redirect(`/leads?erro=${encodeURIComponent(error.message)}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  redirect(`/leads/${data.id}`);
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  if (!Object.hasOwn(leadStatusLabels, status)) {
    return { success: false, error: "Etapa inválida." };
  }
  if (!isSupabaseConfigured()) return { success: true };
  const { supabase, userId } = await authenticatedClient();
  const { data: statusRecord } = await supabase
    .from("lead_statuses")
    .select("id")
    .eq("owner_id", userId)
    .eq("slug", status)
    .single();
  if (!statusRecord) return { success: false, error: "Etapa não encontrada." };
  const { error } = await supabase
    .from("leads")
    .update({ status_id: statusRecord.id, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  return { success: true };
}

export async function addNoteAction(formData: FormData) {
  const leadId = value(formData, "lead_id");
  if (!isSupabaseConfigured()) redirect(`/leads/${leadId}?modo=demo`);
  const { supabase, userId } = await authenticatedClient();
  await supabase.from("lead_notes").insert({
    lead_id: leadId,
    owner_id: userId,
    content: value(formData, "content"),
  });
  revalidatePath(`/leads/${leadId}`);
}

export async function createTaskAction(formData: FormData) {
  const leadId = value(formData, "lead_id") || null;
  if (!isSupabaseConfigured()) redirect(leadId ? `/leads/${leadId}?modo=demo` : "/tarefas?modo=demo");
  const { supabase, userId } = await authenticatedClient();
  await supabase.from("lead_tasks").insert({
    owner_id: userId,
    lead_id: leadId,
    title: value(formData, "title"),
    due_at: value(formData, "due_at"),
    priority: taskPriority(formData),
  });
  revalidatePath("/tarefas");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function toggleTaskAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/tarefas?modo=demo");
  const { supabase } = await authenticatedClient();
  await supabase
    .from("lead_tasks")
    .update({ completed: value(formData, "completed") !== "true" })
    .eq("id", value(formData, "task_id"));
  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
}

export async function updateProfileAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/configuracoes?modo=demo");
  const { supabase, userId } = await authenticatedClient();
  await supabase
    .from("profiles")
    .update({
      full_name: value(formData, "full_name"),
      company_name: value(formData, "company_name"),
      phone: value(formData, "phone") || null,
      public_form_slug: value(formData, "public_form_slug"),
    })
    .eq("id", userId);
  revalidatePath("/configuracoes");
}

export async function capturePublicLeadAction(formData: FormData) {
  const slug = value(formData, "slug");
  if (!/^[a-z0-9-]+$/.test(slug)) redirect("/");
  const name = value(formData, "name");
  const phone = value(formData, "phone");
  const email = value(formData, "email").toLowerCase();
  const city = value(formData, "city");
  const objective = value(formData, "objective");
  const budget = Number(value(formData, "budget"));
  const preferredContactTime = value(formData, "preferred_contact_time");
  const message = value(formData, "message");
  const allowedContactTimes = new Set([
    "Manhã, das 8h às 12h",
    "Tarde, das 12h às 18h",
    "Noite, após as 18h",
    "Qualquer horário comercial",
  ]);

  function formError(messageText: string): never {
    redirect(`/f/${slug}?erro=${encodeURIComponent(messageText)}`);
  }

  if (!isSupabaseConfigured()) formError("Formulário temporariamente indisponível. Tente novamente mais tarde.");
  if (name.length < 2 || name.length > 120) formError("Informe um nome válido.");
  if (phone.replace(/\D/g, "").length < 10 || phone.length > 30) formError("Informe um WhatsApp válido com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) formError("Informe um e-mail válido.");
  if (city.length < 2 || city.length > 120) formError("Informe uma cidade válida.");
  if (objective.length < 3 || objective.length > 500) formError("Conte brevemente qual é o seu objetivo.");
  if (!Number.isFinite(budget) || budget < 0) formError("Informe um orçamento aproximado válido.");
  if (!allowedContactTimes.has(preferredContactTime)) formError("Selecione o melhor horário para contato.");
  if (message.length > 5000) formError("A mensagem deve ter no máximo 5.000 caracteres.");

  const { url, key } = getSupabaseConfig();
  const supabase = createPublicClient<Database>(url, key);
  const { error } = await supabase.rpc("capture_public_lead", {
    form_slug: slug,
    lead_name: name,
    lead_phone: phone,
    lead_email: email,
    lead_city: city,
    lead_objective: objective,
    lead_budget: budget,
    lead_preferred_contact_time: preferredContactTime,
    lead_message: message || null,
  });
  if (error) formError("Não foi possível enviar agora. Revise os dados e tente novamente.");
  redirect(`/f/${slug}?enviado=1`);
}
