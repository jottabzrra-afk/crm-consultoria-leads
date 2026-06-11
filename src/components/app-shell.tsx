import { LogOut, Plus, Search } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { MobileNav, SidebarNav } from "@/components/sidebar-nav";
import { getCurrentProfile } from "@/lib/data";
import { initials } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const disconnected = !isSupabaseConfigured();
  const displayedName = disconnected ? "Supabase não conectado" : profile?.full_name || "Perfil indisponível";
  const displayedCompany = disconnected ? "Configure as variáveis do projeto" : profile?.company_name || "Verifique a tabela profiles";

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[244px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] flex-col bg-brand-strong px-4 py-5 lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mt-9 flex-1"><SidebarNav /></div>
        {disconnected && (
          <div className="mb-4 rounded-xl border border-accent/20 bg-accent/10 p-3 text-xs leading-5 text-white/70">
            <span className="font-semibold text-accent">Supabase desconectado</span><br />
            O dashboard não exibirá dados fictícios.
          </div>
        )}
        <div className="flex items-center gap-3 border-t border-white/8 pt-4">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
            {disconnected || !profile ? "DB" : initials(profile.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{displayedName}</p>
            <p className="truncate text-xs text-white/45">{displayedCompany}</p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg p-2 text-white/45 transition-colors hover:bg-white/8 hover:text-white" aria-label="Sair">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-line/80 bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="lg:hidden"><Brand compact /></div>
          <form action="/leads" className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              name="busca"
              aria-label="Buscar leads"
              placeholder="Buscar leads, empresas..."
              className="h-10 w-full rounded-xl border border-line bg-white/70 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/70 transition focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-accent/20"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/leads/novo" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-strong sm:px-4">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Novo lead</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
