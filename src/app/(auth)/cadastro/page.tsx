import { ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { signUpAction } from "@/app/actions";
import { Field, inputClass } from "@/components/form-fields";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Criar conta" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  return (
    <>
      <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-brand"><UserPlus className="size-5" /></span>
      <h1 className="mt-5 text-3xl font-bold tracking-[-0.045em]">Comece a organizar seus leads</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Crie sua conta e tenha uma visão clara da operação comercial.</p>
      {params.erro && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.erro}</div>}
      {!configured && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">Configure o Supabase antes de criar a primeira conta.</div>}
      <form action={signUpAction} className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field label="Seu nome"><input name="full_name" required placeholder="Nome completo" className={inputClass} /></Field>
        <Field label="Empresa"><input name="company_name" required placeholder="Sua empresa" className={inputClass} /></Field>
        <div className="sm:col-span-2"><Field label="E-mail"><input name="email" type="email" required placeholder="voce@empresa.com.br" className={inputClass} /></Field></div>
        <div className="sm:col-span-2"><Field label="Senha" hint="Use pelo menos 8 caracteres."><input name="password" type="password" minLength={8} required placeholder="Crie uma senha segura" className={inputClass} /></Field></div>
        <button disabled={!configured} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">Criar minha conta<ArrowRight className="size-4" /></button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Já tem uma conta? <Link href="/login" className="font-bold text-brand hover:text-brand-strong">Entrar</Link></p>
    </>
  );
}
