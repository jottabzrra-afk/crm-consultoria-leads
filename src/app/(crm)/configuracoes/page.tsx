import { CircleAlert, DatabaseZap, ExternalLink, Link2, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { updateProfileAction } from "@/app/actions";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Field, inputClass } from "@/components/form-fields";
import { PageHeader } from "@/components/page-header";
import { getCurrentProfile } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Configurações" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [profile, params] = await Promise.all([getCurrentProfile(), searchParams]);
  if (!isSupabaseConfigured()) {
    return <SettingsState icon={DatabaseZap} title="Conecte as configurações ao Supabase" description="Configure as variáveis de ambiente para carregar e salvar os dados reais da sua conta." />;
  }
  if (!profile) {
    return <SettingsState icon={CircleAlert} title="Perfil indisponível" description="Não foi possível carregar seu perfil. Confirme a sessão e o registro correspondente na tabela profiles." error />;
  }
  const formPath = `/f/${profile.public_form_slug}`;
  return (
    <>
      <PageHeader eyebrow="Conta" title="Configurações" description="Ajuste seus dados e o endereço usado para captar novos leads." />
      {params.erro && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.erro}</div>}
      {params.sucesso && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.sucesso}</div>}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <form action={updateProfileAction} className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <div><h2 className="font-bold">Perfil e empresa</h2><p className="mt-1 text-sm text-muted">Informações exibidas na conta e no formulário.</p></div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Seu nome"><input name="full_name" defaultValue={profile.full_name} required className={inputClass} /></Field>
            <Field label="Empresa"><input name="company_name" defaultValue={profile.company_name} required className={inputClass} /></Field>
            <Field label="Telefone"><input name="phone" defaultValue={profile.phone ?? ""} className={inputClass} /></Field>
            <Field label="Endereço do formulário" hint="Use letras minúsculas, números e hífens."><div className="flex"><span className="inline-flex h-11 items-center rounded-l-xl border border-r-0 border-line bg-surface-muted px-3 text-xs text-muted">/f/</span><input name="public_form_slug" defaultValue={profile.public_form_slug} required pattern="[a-z0-9-]+" className={`${inputClass} rounded-l-none`} /></div></Field>
          </div>
          <div className="mt-7 flex justify-end border-t border-line pt-5"><button className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-strong"><Save className="size-4" />Salvar alterações</button></div>
        </form>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-brand-strong p-5 text-white">
            <span className="grid size-10 place-items-center rounded-xl bg-white/8 text-accent"><Link2 className="size-5" /></span>
            <h2 className="mt-4 font-bold">Formulário de captação</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Compartilhe este link em anúncios, bio ou páginas para receber leads direto no CRM.</p>
            <div className="mt-4 rounded-xl bg-white/7 px-3 py-2.5 text-xs text-white/70">{formPath}</div>
            <div className="mt-3 flex gap-2"><CopyLinkButton path={formPath} /><Link href={formPath} target="_blank" className="grid size-10 place-items-center rounded-xl bg-accent text-brand-strong hover:bg-white" aria-label="Abrir formulário"><ExternalLink className="size-4" /></Link></div>
          </section>
          <section className="rounded-2xl border border-line bg-white p-5"><div className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-emerald-600" /><div><h2 className="text-sm font-bold">Dados protegidos</h2><p className="mt-1 text-xs leading-5 text-muted">As políticas RLS do Supabase isolam os dados de cada conta.</p></div></div></section>
        </aside>
      </div>
    </>
  );
}

function SettingsState({ icon: Icon, title, description, error = false }: { icon: typeof DatabaseZap; title: string; description: string; error?: boolean }) {
  return <><PageHeader eyebrow="Conta" title="Configurações" description="Os dados da conta são carregados diretamente do Supabase." /><section className={`rounded-2xl border bg-white p-6 sm:p-8 ${error ? "border-rose-200" : "border-line"}`}><span className={`grid size-11 place-items-center rounded-2xl ${error ? "bg-rose-50 text-rose-700" : "bg-accent-soft text-brand"}`}><Icon className="size-5" /></span><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></section></>;
}
