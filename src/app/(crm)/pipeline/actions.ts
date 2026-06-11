"use server";

import { revalidatePath } from "next/cache";
import { isPipelineStatusSlug } from "@/lib/pipeline";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function movePipelineLeadAction(leadId: string, statusId: string) {
  if (!isSupabaseConfigured()) return { success: false, error: "Supabase não configurado." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { success: false, error: "Sua sessão expirou." };

  const { data: status, error: statusError } = await supabase
    .from("lead_statuses")
    .select("id, slug")
    .eq("id", statusId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (statusError || !status || !isPipelineStatusSlug(status.slug)) {
    return { success: false, error: "A etapa selecionada não está disponível." };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .update({ status_id: status.id })
    .eq("id", leadId)
    .eq("owner_id", userId)
    .select("id")
    .maybeSingle();

  if (error || !lead) return { success: false, error: "Não foi possível mover o lead." };

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
