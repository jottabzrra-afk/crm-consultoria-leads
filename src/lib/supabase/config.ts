export function isSupabaseConfigured() {
  return hasValidSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key || !hasValidSupabaseConfig(url, key)) {
    throw new Error("Variáveis do Supabase ausentes ou ainda com valores de exemplo.");
  }

  return { url, key };
}

function hasValidSupabaseConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key || !key.startsWith("sb_publishable_") || /^sb_publishable_x+$/i.test(key) || /seu_|your/i.test(key)) return false;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:"
      && parsedUrl.hostname.endsWith(".supabase.co")
      && !/seu-projeto|seu_|project_ref/i.test(url);
  } catch {
    return false;
  }
}
