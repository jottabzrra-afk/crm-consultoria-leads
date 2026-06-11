import { ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { loginAction } from "@/app/actions";
import { Field, inputClass } from "@/components/form-fields";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; mensagem?: string }> }) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <>
      <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-brand"><LockKeyhole className="size-5" /></span>
      <h1 className="mt-5 text-3xl font-bold tracking-[-0.045em]">Bem-vindo de volta</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Entre para acompanhar seus leads e próximos passos.</p>
      {params.erro && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.erro}</div>}
      {params.mensagem && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.mensagem}</div>}
      {!configured && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">O Supabase ainda não está configurado. Adicione as variáveis do projeto para habilitar o acesso.</div>}
      <form action={loginAction} className="mt-7 space-y-4">
        <Field label="E-mail"><input name="email" type="email" required placeholder="voce@empresa.com.br" className={inputClass} /></Field>
        <Field label="Senha"><input name="password" type="password" required placeholder="Sua senha" className={inputClass} /></Field>
        <button disabled={!configured} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">Entrar no CRM<ArrowRight className="size-4" /></button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Ainda não tem uma conta? <Link href="/cadastro" className="font-bold text-brand hover:text-brand-strong">Criar conta</Link></p>
    </>
  );
}
