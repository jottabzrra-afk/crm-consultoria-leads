import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type PublicForm = {
  slug: string;
  title: string;
  subtitle: string;
  company_name: string;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, phone, public_form_slug")
    .eq("id", userId)
    .single();

  return data;
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
