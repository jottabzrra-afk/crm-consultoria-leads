import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createLeadAction } from "@/app/actions";
import { Field, inputClass, textareaClass } from "@/components/form-fields";
import { PageHeader } from "@/components/page-header";
import { serviceOptions } from "@/lib/constants";

export const metadata = { title: "Novo lead" };

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/leads" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-brand"><ArrowLeft className="size-4" />Voltar para leads</Link>
      <PageHeader title="Adicionar novo lead" description="Registre as informações essenciais. Você poderá completar o histórico depois." />
      <form action={createLeadAction} className="rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Nome completo"><input name="name" required placeholder="Ex.: Ana Carolina" className={inputClass} /></Field></div>
          <Field label="E-mail"><input name="email" type="email" placeholder="ana@empresa.com.br" className={inputClass} /></Field>
          <Field label="Telefone / WhatsApp"><input name="phone" type="tel" placeholder="(11) 99999-0000" className={inputClass} /></Field>
          <Field label="Cidade"><input name="city" placeholder="Ex.: São Paulo" className={inputClass} /></Field>
          <Field label="Empresa"><input name="company" placeholder="Nome da empresa" className={inputClass} /></Field>
          <Field label="Interesse"><select name="interest" required className={inputClass}><option value="">Selecione</option>{serviceOptions.map((service) => <option key={service}>{service}</option>)}</select></Field>
          <Field label="Origem"><select name="source" className={inputClass}><option>Cadastro manual</option><option>Landing page</option><option>Formulário do site</option><option>Google Ads</option><option>Instagram</option><option>Indicação</option><option>LinkedIn</option></select></Field>
          <Field label="Orçamento" hint="Use apenas números, sem pontos ou vírgulas."><input name="budget" type="number" min="0" step="100" placeholder="10000" className={inputClass} /></Field>
          <div className="sm:col-span-2"><Field label="Observações iniciais"><textarea name="notes" placeholder="Contexto, necessidade ou informação importante sobre o lead" className={textareaClass} /></Field></div>
        </div>
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Link href="/leads" className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-5 text-sm font-bold text-muted hover:bg-surface-muted">Cancelar</Link>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white hover:bg-brand-strong"><Save className="size-4" />Salvar lead</button>
        </div>
      </form>
    </div>
  );
}
