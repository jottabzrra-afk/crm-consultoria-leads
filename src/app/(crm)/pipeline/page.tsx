import {
  CircleAlert,
  CircleDollarSign,
  CircleHelp,
  Columns3,
  DatabaseZap,
  Trophy,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PipelineBoard } from "@/components/pipeline-board";
import { formatCurrency } from "@/lib/format";
import { getSalesPipeline } from "@/lib/pipeline";

export const metadata = { title: "Pipeline" };
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const result = await getSalesPipeline();

  if (result.state === "unconfigured") return <UnconfiguredPipeline />;
  if (result.state === "migration_required") return <MigrationRequired />;
  if (result.state === "error") return <PipelineError message={result.message} />;

  const { statuses, leads } = result.data;
  const totalValue = leads.reduce((sum, lead) => sum + lead.budget, 0);
  const closedStatus = statuses.find((status) => status.isWon);
  const closedLeads = closedStatus ? leads.filter((lead) => lead.statusId === closedStatus.id) : [];
  const activeLeads = leads.filter((lead) => {
    const status = statuses.find((item) => item.id === lead.statusId);
    return status && !status.isWon && !status.isLost;
  });

  return (
    <>
      <PageHeader
        eyebrow="Processo comercial"
        title="Pipeline de vendas"
        description="Mova cada oportunidade entre as etapas e acompanhe o valor da carteira em tempo real."
        action={
          <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-muted">
            <CircleHelp className="size-4" />
            Arraste os cards ou use “Mover para”
          </div>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Resumo do pipeline">
        <Metric icon={UsersRound} label="Leads ativos" value={activeLeads.length.toLocaleString("pt-BR")} />
        <Metric icon={CircleDollarSign} label="Valor no pipeline" value={formatCurrency(totalValue)} />
        <Metric icon={Trophy} label="Fechados" value={`${closedLeads.length} · ${formatCurrency(closedLeads.reduce((sum, lead) => sum + lead.budget, 0))}`} />
      </section>

      <div className="-mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <PipelineBoard initialLeads={leads} statuses={statuses} />
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return <article className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-brand"><Icon className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-0.5 truncate text-lg font-bold tracking-[-0.03em]">{value}</p></div></article>;
}

function UnconfiguredPipeline() {
  return <PipelineState icon={DatabaseZap} title="Conecte o pipeline ao Supabase" description="O Kanban exibe e altera somente leads reais da sua conta. Configure as credenciais e aplique as migrações." />;
}

function MigrationRequired() {
  return <PipelineState icon={Columns3} title="Aplique a migração do pipeline" description="Execute a migração 004 no Supabase para criar as etapas Novo lead, Contato feito, Qualificado, Proposta enviada, Fechado e Perdido." />;
}

function PipelineError({ message }: { message: string }) {
  return <PipelineState icon={CircleAlert} title="Pipeline indisponível" description={message} error />;
}

function PipelineState({ icon: Icon, title, description, error = false }: { icon: typeof DatabaseZap; title: string; description: string; error?: boolean }) {
  return <><PageHeader eyebrow="Processo comercial" title="Pipeline de vendas" description="O quadro não usa dados de demonstração." /><section className={`rounded-3xl border bg-white p-6 sm:p-9 ${error ? "border-rose-200" : "border-line"}`}><span className={`grid size-12 place-items-center rounded-2xl ${error ? "bg-rose-50 text-rose-700" : "bg-accent-soft text-brand"}`}><Icon className="size-6" /></span><h2 className="mt-5 text-xl font-bold tracking-[-0.03em]">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></section></>;
}
