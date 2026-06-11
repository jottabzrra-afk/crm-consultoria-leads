import {
  Activity,
  ArrowRight,
  ArrowRightLeft,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  ContactRound,
  DatabaseZap,
  PencilLine,
  Plus,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getCrmDashboard, type DashboardActivity } from "@/lib/dashboard";
import { formatDate, formatRelativeDate } from "@/lib/format";

export const metadata = { title: "Visão geral" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getCrmDashboard();

  if (result.state === "unconfigured") return <UnconfiguredDashboard />;
  if (result.state === "error") return <DashboardError message={result.message} />;

  const { data } = result;
  const firstName = data.profile.full_name.split(" ")[0] || "por aí";
  const maxStatusCount = Math.max(...data.statuses.map((status) => status.count), 1);
  const pendingCount = data.upcomingTasks.length;

  const metrics = [
    {
      label: "Total de leads",
      value: data.totalLeads.toLocaleString("pt-BR"),
      detail: `${data.closedLeads} ${data.closedLeads === 1 ? "oportunidade encerrada" : "oportunidades encerradas"}`,
      icon: ContactRound,
      accent: "bg-sky-50 text-sky-700",
    },
    {
      label: "Novos leads hoje",
      value: data.newLeadsToday.toLocaleString("pt-BR"),
      detail: "Entradas desde o início do dia",
      icon: UserPlus,
      accent: "bg-amber-50 text-amber-700",
    },
    {
      label: "Taxa de conversão",
      value: `${formatPercentage(data.conversionRate)}%`,
      detail: `${data.wonLeads} ${data.wonLeads === 1 ? "lead fechado" : "leads fechados"} sobre o total`,
      icon: TrendingUp,
      accent: "bg-violet-50 text-violet-700",
    },
    {
      label: "Próximos follow-ups",
      value: pendingCount.toLocaleString("pt-BR"),
      detail: pendingCount ? "Tarefas futuras ainda pendentes" : "Nenhuma tarefa futura pendente",
      icon: CalendarClock,
      accent: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title={`Bom dia, ${firstName}`}
        description="Acompanhe os indicadores e as próximas ações da sua operação comercial."
        action={
          <Link href="/leads/novo" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong">
            <Plus className="size-4" />
            Novo lead
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores comerciais">
        {metrics.map(({ label, value, detail, icon: Icon, accent }) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(20,61,53,0.03)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted">{label}</p>
                <p className="mt-2 text-[28px] font-bold tracking-[-0.05em] text-foreground">{value}</p>
              </div>
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${accent}`}>
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold tracking-[-0.02em]">Leads por status</h2>
              <p className="mt-1 text-sm text-muted">Distribuição atual em todas as etapas do pipeline</p>
            </div>
            <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-strong">
              Ver pipeline <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {data.statuses.length ? (
            <div className="mt-7 grid gap-x-8 gap-y-5 md:grid-cols-2">
              {data.statuses.map((status) => {
                const percentage = data.totalLeads ? (status.count / data.totalLeads) * 100 : 0;
                const barWidth = status.count ? Math.max((status.count / maxStatusCount) * 100, 5) : 0;
                return (
                  <div key={status.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: safeColor(status.color) }} />
                        <p className="truncate text-sm font-semibold text-foreground">{status.name}</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold">{status.count}</span>
                        <span className="text-[11px] text-muted">{formatPercentage(percentage)}%</span>
                      </div>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ backgroundColor: safeColor(status.color), width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={ContactRound} title="Nenhum status configurado" description="Aplique as migrações do Supabase para criar as etapas do pipeline." />
          )}

          <div className="mt-7 flex flex-wrap gap-4 border-t border-line pt-5 text-xs text-muted">
            <span><strong className="text-foreground">{data.totalLeads}</strong> leads no total</span>
            <span><strong className="text-emerald-700">{data.wonLeads}</strong> fechados</span>
            <span><strong className="text-foreground">{data.closedLeads}</strong> encerrados</span>
          </div>
        </article>

        <article className="rounded-2xl border border-line bg-brand-strong p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold tracking-[-0.02em]">Próximos follow-ups</h2>
              <p className="mt-1 text-sm text-white/50">Tarefas futuras em ordem de vencimento</p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-white/8 text-accent"><CalendarClock className="size-[18px]" /></span>
          </div>

          {data.upcomingTasks.length ? (
            <div className="mt-5 divide-y divide-white/8">
              {data.upcomingTasks.map((task) => (
                <div key={task.id} className="flex gap-3 py-3.5 first:pt-0">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${priorityColor(task.priority)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/90">{task.title}</p>
                    <p className="mt-1 text-xs text-white/45">{task.lead?.name ?? "Tarefa geral"}</p>
                  </div>
                  <time className="shrink-0 text-right text-[11px] font-semibold leading-4 text-white/55" dateTime={task.due_at}>
                    {formatDate(task.due_at, true)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center">
              <CheckCircle2 className="mx-auto size-6 text-accent" />
              <p className="mt-3 text-sm font-semibold">Agenda em dia</p>
              <p className="mt-1 text-xs leading-5 text-white/45">Nenhum follow-up futuro está pendente.</p>
            </div>
          )}

          <Link href="/tarefas" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-accent transition-colors hover:text-white">
            Ver todas as tarefas <ArrowRight className="size-3.5" />
          </Link>
        </article>
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold tracking-[-0.02em]">Atividades recentes</h2>
            <p className="mt-1 text-sm text-muted">Últimas movimentações registradas no CRM</p>
          </div>
          <Activity className="size-5 text-muted" strokeWidth={1.8} />
        </div>

        {data.activities.length ? (
          <div className="divide-y divide-line">
            {data.activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Activity} title="Nenhuma atividade registrada" description="As movimentações aparecerão aqui quando leads forem criados ou atualizados." />
        )}
      </section>
    </>
  );
}

function ActivityRow({ activity }: { activity: DashboardActivity }) {
  const presentation = activityPresentation(activity.action);
  const Icon = presentation.icon;

  return (
    <article className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-surface-muted/35 sm:px-6">
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${presentation.className}`}>
        <Icon className="size-4" strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{presentation.label}</p>
        {activity.leadId && activity.leadName ? (
          <Link href={`/leads/${activity.leadId}`} className="mt-0.5 inline-block truncate text-xs font-medium text-brand hover:text-brand-strong">
            {activity.leadName}
          </Link>
        ) : (
          <p className="mt-0.5 text-xs text-muted">Lead indisponível</p>
        )}
      </div>
      <time className="shrink-0 text-[11px] font-medium text-muted" dateTime={activity.createdAt}>
        {formatRelativeDate(activity.createdAt)}
      </time>
    </article>
  );
}

function UnconfiguredDashboard() {
  return (
    <>
      <PageHeader eyebrow="Visão geral" title="Conecte seu CRM ao Supabase" description="O dashboard exibe somente dados reais do seu projeto Supabase." />
      <section className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:p-12">
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-brand"><DatabaseZap className="size-6" /></span>
            <h2 className="mt-5 text-2xl font-bold tracking-[-0.04em]">Dados reais, sem demonstração</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted">Configure as credenciais e aplique as migrações para visualizar leads, conversão, atividades e follow-ups desta conta.</p>
          </div>
          <ol className="space-y-3">
            <SetupStep number="1" title="Configure o ambiente" description="Adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ao arquivo .env.local." />
            <SetupStep number="2" title="Aplique as migrações" description="Execute as migrações 001, 002 e 003 no SQL Editor ou use supabase db push." />
            <SetupStep number="3" title="Entre novamente" description="Reinicie o servidor e autentique-se para carregar os dados protegidos por RLS." />
          </ol>
        </div>
      </section>
    </>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <>
      <PageHeader eyebrow="Visão geral" title="Dashboard indisponível" description="Os dados reais não puderam ser carregados neste momento." />
      <section className="rounded-2xl border border-rose-200 bg-white p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><CircleAlert className="size-5" /></span>
        <h2 className="mt-4 text-lg font-bold">Verifique a integração com o Supabase</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{message}</p>
        <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-strong">
          Tentar novamente <ArrowRight className="size-4" />
        </Link>
      </section>
    </>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Activity; title: string; description: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-surface-muted text-muted"><Icon className="size-5" /></span>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

function SetupStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-line bg-background/60 p-4">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand text-xs font-bold text-white">{number}</span>
      <div className="min-w-0"><p className="text-sm font-bold">{title}</p><p className="mt-1 break-words text-xs leading-5 text-muted [overflow-wrap:anywhere]">{description}</p></div>
    </li>
  );
}

function activityPresentation(action: string) {
  switch (action) {
    case "lead_created":
      return { label: "Novo lead cadastrado", icon: UserPlus, className: "bg-sky-50 text-sky-700" };
    case "lead_status_changed":
      return { label: "Etapa do lead atualizada", icon: ArrowRightLeft, className: "bg-violet-50 text-violet-700" };
    case "lead_updated":
      return { label: "Dados do lead atualizados", icon: PencilLine, className: "bg-amber-50 text-amber-700" };
    default:
      return { label: "Atividade registrada", icon: Activity, className: "bg-surface-muted text-muted" };
  }
}

function priorityColor(priority: "baixa" | "media" | "alta") {
  if (priority === "alta") return "bg-rose-400";
  if (priority === "media") return "bg-amber-300";
  return "bg-accent";
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value);
}

function safeColor(color: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}
