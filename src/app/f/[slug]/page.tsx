import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  DatabaseZap,
  LockKeyhole,
  MessageCircleMore,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { capturePublicLeadAction } from "@/app/actions";
import { Brand } from "@/components/brand";
import { Field, inputClass, textareaClass } from "@/components/form-fields";
import { PublicLeadSubmit } from "@/components/public-lead-submit";
import { getPublicForm } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type PublicFormSearchParams = {
  enviado?: string | string[];
  erro?: string | string[];
};

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<PublicFormSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <UnavailablePublicForm />;

  const form = await getPublicForm(slug);
  if (!form) notFound();

  const sent = firstParam(query.enviado) === "1";
  const error = firstParam(query.erro);

  return (
    <main className="min-h-screen bg-brand-strong px-4 py-5 sm:px-6 sm:py-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <Brand />
        <div className="mt-8 grid overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-black/15 lg:mt-10 lg:grid-cols-[0.82fr_1.18fr]">
          <PublicFormHero companyName={form.company_name} title={form.title} subtitle={form.subtitle} />
          <section className="p-6 sm:p-9 lg:p-12">
            {sent ? <ThankYouScreen slug={slug} companyName={form.company_name} /> : <LeadCaptureForm slug={slug} error={error} />}
          </section>
        </div>
        <p className="mt-5 text-center text-[11px] text-white/40">Formulário seguro · Seus dados serão usados somente para responder à sua solicitação.</p>
      </div>
    </main>
  );
}

function PublicFormHero({ companyName, title, subtitle }: { companyName: string; title: string; subtitle: string }) {
  return (
    <section className="relative overflow-hidden bg-[#eaf1e5] p-7 sm:p-10 lg:p-12">
      <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand/55">{companyName}</p>
        <h1 className="mt-5 max-w-md text-4xl font-bold leading-[1.08] tracking-[-0.055em] text-brand-strong sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-md text-base leading-7 text-muted">{subtitle}</p>

        <div className="mt-9 rounded-2xl border border-brand/10 bg-white/55 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand/55">Por que preencher?</p>
          <p className="mt-2 text-sm leading-6 text-brand">Com essas informações, nossa primeira conversa já começa focada no seu objetivo e nas melhores possibilidades para o seu momento.</p>
        </div>

        <div className="mt-7 space-y-3.5">
          <Trust icon={Clock3} text="Retorno no melhor horário para você" />
          <Trust icon={ShieldCheck} text="Dados tratados com privacidade" />
          <Trust icon={CheckCircle2} text="Primeira conversa sem compromisso" />
        </div>
      </div>
    </section>
  );
}

function LeadCaptureForm({ slug, error }: { slug: string; error: string }) {
  return (
    <>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand/55">Conte sobre seu momento</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">Receba um contato personalizado</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Leva cerca de dois minutos. Os campos ajudam nossa equipe a preparar uma conversa mais objetiva.</p>
      </div>

      {error && <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert"><MessageCircleMore className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}

      <form action={capturePublicLeadAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="slug" value={slug} />
        <Field label="Nome"><input name="name" required minLength={2} maxLength={120} autoComplete="name" placeholder="Seu nome completo" className={inputClass} /></Field>
        <Field label="WhatsApp"><input name="phone" type="tel" required maxLength={30} autoComplete="tel" inputMode="tel" placeholder="(11) 99999-0000" className={inputClass} /></Field>
        <Field label="E-mail"><input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="voce@empresa.com.br" className={inputClass} /></Field>
        <Field label="Cidade"><input name="city" required minLength={2} maxLength={120} autoComplete="address-level2" placeholder="Sua cidade" className={inputClass} /></Field>
        <div className="sm:col-span-2"><Field label="Objetivo"><textarea name="objective" required minLength={3} maxLength={500} placeholder="O que você deseja alcançar neste momento?" className="min-h-24 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-foreground placeholder:text-muted/60 transition focus:border-brand/35 focus:ring-2 focus:ring-accent/20" /></Field></div>
        <Field label="Orçamento aproximado" hint="Informe uma estimativa em reais."><input name="budget" type="number" required min="0" step="500" inputMode="numeric" placeholder="Ex.: 10000" className={inputClass} /></Field>
        <Field label="Melhor horário para contato">
          <select name="preferred_contact_time" required defaultValue="" className={inputClass}>
            <option value="" disabled>Selecione um período</option>
            <option value="Manhã, das 8h às 12h">Manhã, das 8h às 12h</option>
            <option value="Tarde, das 12h às 18h">Tarde, das 12h às 18h</option>
            <option value="Noite, após as 18h">Noite, após as 18h</option>
            <option value="Qualquer horário comercial">Qualquer horário comercial</option>
          </select>
        </Field>
        <div className="sm:col-span-2"><Field label="Mensagem" hint="Opcional"><textarea name="message" maxLength={5000} placeholder="Compartilhe algum contexto adicional que possa ajudar nossa equipe." className={textareaClass} /></Field></div>
        <PublicLeadSubmit />
      </form>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-muted"><LockKeyhole className="size-3.5" />Ao enviar, você concorda em ser contatado sobre esta solicitação.</p>
    </>
  );
}

function ThankYouScreen({ slug, companyName }: { slug: string; companyName: string }) {
  return (
    <div className="flex min-h-[610px] flex-col justify-center">
      <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-emerald-700"><CheckCircle2 className="size-8" /></span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Solicitação enviada</p>
      <h2 className="mt-2 max-w-lg text-3xl font-bold leading-tight tracking-[-0.045em] text-foreground">Obrigado. Sua conversa com a {companyName} já começou.</h2>
      <p className="mt-4 max-w-lg text-sm leading-6 text-muted">Recebemos suas informações com sucesso. Nossa equipe vai analisar seu objetivo e entrar em contato no período indicado.</p>

      <div className="mt-7 rounded-2xl border border-line bg-background/60 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">O que acontece agora</p>
        <div className="mt-4 space-y-4">
          <NextStep icon={SearchCheck} title="Análise da solicitação" description="Vamos revisar seu objetivo e o contexto compartilhado." />
          <NextStep icon={Clock3} title="Contato no horário escolhido" description="Um especialista falará com você no período mais conveniente." />
          <NextStep icon={MessageCircleMore} title="Conversa objetiva" description="A primeira conversa será focada em entender o cenário e indicar próximos passos." />
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link href={`/f/${slug}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-5 text-sm font-bold text-brand transition-colors hover:bg-surface-muted">Enviar outra solicitação <ArrowRight className="size-4" /></Link>
        <p className="text-xs leading-5 text-muted">Você já pode fechar esta página com tranquilidade.</p>
      </div>
    </div>
  );
}

function Trust({ icon: Icon, text }: { icon: typeof Clock3; text: string }) {
  return <div className="flex items-center gap-3 text-sm font-semibold text-brand"><span className="grid size-9 place-items-center rounded-xl bg-white/70"><Icon className="size-4" /></span>{text}</div>;
}

function NextStep({ icon: Icon, title, description }: { icon: typeof Clock3; title: string; description: string }) {
  return <div className="flex gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm"><Icon className="size-4" /></span><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-xs leading-5 text-muted">{description}</p></div></div>;
}

function UnavailablePublicForm() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-strong px-4 py-8">
      <section className="w-full max-w-xl rounded-3xl bg-white p-7 text-center shadow-2xl sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent-soft text-brand"><DatabaseZap className="size-7" /></span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">Formulário temporariamente indisponível</h1>
        <p className="mt-3 text-sm leading-6 text-muted">A integração de atendimento ainda não foi configurada. Tente novamente mais tarde.</p>
      </section>
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
