import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  CalendarCheck2,
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  DatabaseZap,
  Mail,
  MapPin,
  MessageSquareText,
  PencilLine,
  Phone,
  Plus,
  Save,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Field, inputClass, textareaClass } from "@/components/form-fields";
import { LeadAvatar } from "@/components/lead-avatar";
import { formatDate, formatRelativeDate } from "@/lib/format";
import {
  getSupabaseLeadDetail,
  type LeadActivity,
  type LeadDetailRecord,
  type LeadDetailTask,
} from "@/lib/lead-detail";
import {
  addLeadNoteAction,
  createLeadFollowUpAction,
  toggleLeadFollowUpAction,
  updateLeadDetailsAction,
  updateLeadPipelineStatusAction,
} from "./actions";

export const metadata = { title: "Detalhes do lead" };
export const dynamic = "force-dynamic";

type DetailSearchParams = {
  sucesso?: string | string[];
  erro?: string | string[];
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailSearchParams>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const result = await getSupabaseLeadDetail(id);

  if (result.state === "unconfigured") return <UnconfiguredLead />;
  if (result.state === "not_found") notFound();
  if (result.state === "error") return <LeadDetailError message={result.message} />;

  const { lead, statuses, sources, notes, tasks, activities } = result.data;
  const successMessage = firstParam(query.sucesso);
  const errorMessage = firstParam(query.erro);
  const pendingTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <>
      <Link href="/leads" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted transition-colors hover:text-brand">
        <ArrowLeft className="size-4" />
        Voltar para leads
      </Link>

      {(successMessage || errorMessage) && (
        <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${errorMessage ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="status">
          {errorMessage ? <CircleAlert className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
          <p className="font-semibold">{errorMessage || successMessage}</p>
        </div>
      )}

      <LeadHero lead={lead} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <main className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,61,53,0.03)] sm:p-6">
            <SectionHeading icon={PencilLine} title="Informações do lead" description="Mantenha os dados de contato e da oportunidade atualizados" />
            <form action={updateLeadDetailsAction} className="mt-6">
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Nome completo"><input name="name" required minLength={2} defaultValue={lead.name} className={inputClass} /></Field></div>
                <Field label="E-mail"><input name="email" type="email" defaultValue={lead.email ?? ""} placeholder="contato@empresa.com.br" className={inputClass} /></Field>
                <Field label="Telefone / WhatsApp"><input name="phone" type="tel" defaultValue={lead.phone ?? ""} placeholder="(11) 99999-0000" className={inputClass} /></Field>
                <Field label="Cidade"><input name="city" defaultValue={lead.city ?? ""} placeholder="São Paulo" className={inputClass} /></Field>
                <Field label="Empresa"><input name="company" defaultValue={lead.company ?? ""} placeholder="Nome da empresa" className={inputClass} /></Field>
                <Field label="Interesse"><input name="interest" required defaultValue={lead.interest} placeholder="Serviço ou solução de interesse" className={inputClass} /></Field>
                <Field label="Origem">
                  <select name="source_id" required defaultValue={lead.source_id} className={inputClass}>
                    {sources.map((source) => <option key={source.id} value={source.id}>{source.name}{source.active ? "" : " (inativa)"}</option>)}
                  </select>
                </Field>
                <Field label="Orçamento"><input name="budget" type="number" min="0" step="100" defaultValue={lead.budget} className={inputClass} /></Field>
                <Field label="Melhor horário para contato"><input name="preferred_contact_time" defaultValue={lead.preferred_contact_time ?? ""} placeholder="Ex.: Manhã, das 8h às 12h" className={inputClass} /></Field>
                <div className="sm:col-span-2"><Field label="Observações iniciais"><textarea name="notes" defaultValue={lead.notes ?? ""} placeholder="Contexto principal desta oportunidade" className={textareaClass} /></Field></div>
              </div>
              <div className="mt-6 flex justify-end border-t border-line pt-5">
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  <Save className="size-4" />
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>

          <section id="notas" className="scroll-mt-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
            <SectionHeading icon={MessageSquareText} title="Notas" description="Registre conversas, objeções e decisões importantes" accent="bg-violet-50 text-violet-700" />
            <form action={addLeadNoteAction} className="mt-5 rounded-2xl border border-line bg-background/55 p-3.5">
              <input type="hidden" name="lead_id" value={lead.id} />
              <label htmlFor="lead-note" className="sr-only">Nova nota</label>
              <textarea id="lead-note" name="content" required maxLength={5000} placeholder="Escreva uma atualização sobre este lead..." className="min-h-24 w-full resize-y bg-transparent px-1 text-sm leading-6 placeholder:text-muted/65 focus:outline-none" />
              <div className="mt-2 flex justify-end">
                <button className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-xs font-bold text-white hover:bg-brand-strong">
                  <Plus className="size-3.5" />
                  Adicionar nota
                </button>
              </div>
            </form>

            {notes.length ? (
              <div className="mt-6 space-y-4">
                {notes.map((note) => (
                  <article key={note.id} className="rounded-2xl border border-line bg-white p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/85">{note.content}</p>
                    <time className="mt-3 block text-[11px] font-semibold text-muted" dateTime={note.created_at}>{formatDate(note.created_at, true)}</time>
                  </article>
                ))}
              </div>
            ) : (
              <EmptySection icon={MessageSquareText} title="Nenhuma nota registrada" description="A primeira atualização adicionada aparecerá aqui." />
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <SectionHeading icon={Activity} title="Histórico de atividades" description="Linha do tempo das principais movimentações deste lead" accent="bg-sky-50 text-sky-700" />
            {activities.length ? (
              <div className="mt-6">
                {activities.map((activity, index) => <ActivityItem key={activity.id} activity={activity} last={index === activities.length - 1} />)}
              </div>
            ) : (
              <EmptySection icon={Activity} title="Nenhuma atividade registrada" description="As próximas movimentações serão exibidas nesta linha do tempo." />
            )}
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5">
            <SectionHeading icon={ArrowRightLeft} title="Status do pipeline" description="Etapa atual desta oportunidade" />
            <div className="mt-5 rounded-2xl border border-line bg-background/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Status atual</p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: safeColor(lead.status?.color) }} />
                <p className="font-bold">{lead.status?.name ?? "Sem status"}</p>
              </div>
            </div>
            <form action={updateLeadPipelineStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <Field label="Mover para">
                <select name="status_id" defaultValue={lead.status_id} className={inputClass}>
                  {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                </select>
              </Field>
              <button className="h-10 w-full rounded-xl border border-brand/15 bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong">Atualizar status</button>
            </form>
          </section>

          <section id="tarefas" className="scroll-mt-5 overflow-hidden rounded-2xl border border-line bg-brand-strong text-white">
            <div className="p-5">
              <SectionHeading icon={CalendarClock} title="Follow-ups" description={`${pendingTasks.length} ${pendingTasks.length === 1 ? "tarefa pendente" : "tarefas pendentes"}`} dark />
              <form action={createLeadFollowUpAction} className="mt-5 space-y-3 rounded-2xl bg-white/7 p-4">
                <input type="hidden" name="lead_id" value={lead.id} />
                <DarkField label="Atividade"><input name="title" required maxLength={240} placeholder="Ex.: Enviar proposta revisada" className={darkInputClass} /></DarkField>
                <DarkField label="Data e hora"><input name="due_at" type="datetime-local" required className={darkInputClass} /></DarkField>
                <DarkField label="Prioridade"><select name="priority" defaultValue="media" className={darkInputClass}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></DarkField>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-brand-strong transition-colors hover:bg-white">
                  <Plus className="size-4" />
                  Criar follow-up
                </button>
              </form>
            </div>

            <div className="border-t border-white/10">
              {pendingTasks.length ? (
                <div className="divide-y divide-white/8">
                  {pendingTasks.map((task) => <TaskItem key={task.id} leadId={lead.id} task={task} />)}
                </div>
              ) : (
                <div className="px-5 py-8 text-center"><CalendarCheck2 className="mx-auto size-6 text-accent" /><p className="mt-3 text-sm font-bold">Agenda em dia</p><p className="mt-1 text-xs text-white/45">Nenhum follow-up pendente.</p></div>
              )}
              {completedTasks.length > 0 && (
                <details className="border-t border-white/10">
                  <summary className="px-5 py-3 text-xs font-bold text-white/55 hover:text-white">Ver {completedTasks.length} {completedTasks.length === 1 ? "concluído" : "concluídos"}</summary>
                  <div className="divide-y divide-white/8 border-t border-white/8">{completedTasks.map((task) => <TaskItem key={task.id} leadId={lead.id} task={task} />)}</div>
                </details>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function LeadHero({ lead }: { lead: LeadDetailRecord }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_1px_2px_rgba(20,61,53,0.03)]">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
        <LeadAvatar name={lead.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-[-0.04em] sm:text-[28px]">{lead.name}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={statusStyle(lead.status?.color)}>
              <span className="size-1.5 rounded-full" style={{ backgroundColor: safeColor(lead.status?.color) }} />
              {lead.status?.name ?? "Sem status"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted">{lead.company ?? lead.interest} · Lead desde {formatDate(lead.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-xs font-bold text-brand transition-colors hover:bg-surface-muted"><Phone className="size-4" />WhatsApp</a>}
          {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-3.5 text-xs font-bold text-white transition-colors hover:bg-brand-strong"><Mail className="size-4" />E-mail</a>}
        </div>
      </div>
      <div className="grid border-t border-line bg-surface-muted/35 sm:grid-cols-3">
        <HeroDetail icon={Phone} label="Telefone" value={lead.phone ?? "Não informado"} />
        <HeroDetail icon={Mail} label="E-mail" value={lead.email ?? "Não informado"} />
        <HeroDetail icon={MapPin} label="Cidade" value={lead.city ?? "Não informada"} last />
      </div>
    </section>
  );
}

function HeroDetail({ icon: Icon, label, value, last = false }: { icon: typeof Phone; label: string; value: string; last?: boolean }) {
  return <div className={`flex min-w-0 items-center gap-3 px-5 py-4 sm:px-7 ${last ? "" : "border-b border-line sm:border-b-0 sm:border-r"}`}><Icon className="size-4 shrink-0 text-muted" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">{label}</p><p className="mt-0.5 truncate text-sm font-semibold">{value}</p></div></div>;
}

function SectionHeading({ icon: Icon, title, description, accent = "bg-accent-soft text-brand", dark = false }: { icon: typeof Activity; title: string; description: string; accent?: string; dark?: boolean }) {
  return <div className="flex items-center gap-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${dark ? "bg-white/8 text-accent" : accent}`}><Icon className="size-[18px]" /></span><div><h2 className={`font-bold ${dark ? "text-white" : "text-foreground"}`}>{title}</h2><p className={`text-xs ${dark ? "text-white/45" : "text-muted"}`}>{description}</p></div></div>;
}

function ActivityItem({ activity, last }: { activity: LeadActivity; last: boolean }) {
  const presentation = activityPresentation(activity.type);
  const Icon = presentation.icon;
  return (
    <article className="relative flex gap-3.5 pb-6 last:pb-0">
      {!last && <span className="absolute bottom-0 left-[17px] top-9 w-px bg-line" />}
      <span className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl ${presentation.className}`}><Icon className="size-4" /></span>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="text-sm font-bold">{activity.title}</p>
          <time className="shrink-0 text-[11px] font-semibold text-muted" dateTime={activity.createdAt}>{formatRelativeDate(activity.createdAt)}</time>
        </div>
        {activity.description && <p className="mt-1 text-xs leading-5 text-muted">{activity.description}</p>}
      </div>
    </article>
  );
}

function TaskItem({ leadId, task }: { leadId: string; task: LeadDetailTask }) {
  return (
    <form action={toggleLeadFollowUpAction} className="flex items-start gap-3 px-5 py-4">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="task_id" value={task.id} />
      <input type="hidden" name="completed" value={String(task.completed)} />
      <button className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${task.completed ? "border-accent bg-accent text-brand-strong" : "border-white/25 text-transparent hover:border-accent hover:text-accent"}`} aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`}>
        <Check className="size-3.5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold ${task.completed ? "text-white/40 line-through" : "text-white/90"}`}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-white/45">{formatDate(task.due_at, true)}</span>
          <span className={`rounded-full px-1.5 py-0.5 font-bold ${priorityClass(task.priority)}`}>{priorityLabel(task.priority)}</span>
        </div>
      </div>
    </form>
  );
}

function DarkField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-white/70">{label}</span>{children}</label>;
}

function EmptySection({ icon: Icon, title, description }: { icon: typeof Activity; title: string; description: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-line px-5 py-9 text-center"><Icon className="mx-auto size-5 text-muted" /><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted">{description}</p></div>;
}

function UnconfiguredLead() {
  return (
    <>
      <Link href="/leads" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-brand"><ArrowLeft className="size-4" />Voltar para leads</Link>
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-9"><span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-brand"><DatabaseZap className="size-6" /></span><h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">Conecte o detalhe ao Supabase</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Esta página exibe e altera somente dados reais. Configure as credenciais e aplique as migrações para acessar o lead.</p></section>
    </>
  );
}

function LeadDetailError({ message }: { message: string }) {
  return (
    <>
      <Link href="/leads" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-brand"><ArrowLeft className="size-4" />Voltar para leads</Link>
      <section className="rounded-2xl border border-rose-200 bg-white p-6 sm:p-8"><span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><CircleAlert className="size-5" /></span><h1 className="mt-4 text-xl font-bold">Detalhes indisponíveis</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{message}</p></section>
    </>
  );
}

const darkInputClass = "h-10 w-full rounded-xl border border-white/12 bg-white/8 px-3 text-xs text-white placeholder:text-white/30 transition-colors focus:border-accent/70 focus:ring-2 focus:ring-accent/15 [color-scheme:dark]";

function activityPresentation(type: LeadActivity["type"]) {
  if (type === "created") return { icon: UserPlus, className: "bg-sky-50 text-sky-700" };
  if (type === "status") return { icon: ArrowRightLeft, className: "bg-violet-50 text-violet-700" };
  if (type === "updated") return { icon: PencilLine, className: "bg-amber-50 text-amber-700" };
  if (type === "note") return { icon: MessageSquareText, className: "bg-emerald-50 text-emerald-700" };
  if (type === "task_completed") return { icon: CalendarCheck2, className: "bg-emerald-50 text-emerald-700" };
  if (type === "task") return { icon: Clock3, className: "bg-sky-50 text-sky-700" };
  return { icon: Activity, className: "bg-surface-muted text-muted" };
}

function safeColor(color: string | undefined) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}

function statusStyle(color: string | undefined) {
  const safe = safeColor(color);
  return { color: safe, borderColor: `${safe}35`, backgroundColor: `${safe}12` };
}

function priorityClass(priority: LeadDetailTask["priority"]) {
  if (priority === "alta") return "bg-rose-400/15 text-rose-200";
  if (priority === "media") return "bg-amber-300/15 text-amber-200";
  return "bg-emerald-300/15 text-emerald-200";
}

function priorityLabel(priority: LeadDetailTask["priority"]) {
  if (priority === "alta") return "Alta";
  if (priority === "media") return "Média";
  return "Baixa";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
