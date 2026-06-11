import {
  ArrowDownUp,
  ArrowRight,
  CircleAlert,
  DatabaseZap,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { LeadAvatar } from "@/components/lead-avatar";
import { PageHeader } from "@/components/page-header";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  getSupabaseLeadsList,
  type LeadsListFilters,
  type LeadsListItem,
} from "@/lib/leads-list";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

type LeadsSearchParams = {
  busca?: string | string[];
  status?: string | string[];
  origem?: string | string[];
  ordem?: string | string[];
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<LeadsSearchParams>;
}) {
  const params = await searchParams;
  const order = firstParam(params.ordem) === "antigos" ? "antigos" : "recentes";
  const filters: LeadsListFilters = {
    search: firstParam(params.busca).trim(),
    status: firstParam(params.status),
    source: firstParam(params.origem),
    order,
  };
  const result = await getSupabaseLeadsList(filters);

  if (result.state === "unconfigured") return <UnconfiguredLeads />;
  if (result.state === "error") return <LeadsError message={result.message} />;

  const { leads, statuses, sources, total } = result.data;
  const hasFilters = Boolean(filters.search || filters.status || filters.source);
  const activeFilterCount = [filters.search, filters.status, filters.source].filter(Boolean).length;

  return (
    <>
      <PageHeader
        eyebrow="Relacionamento"
        title="Leads"
        description="Encontre oportunidades, organize a carteira e avance cada conversa com contexto."
        action={
          <Link
            href="/leads/novo"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Plus className="size-4" />
            Adicionar lead
          </Link>
        }
      />

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(20,61,53,0.03)]">
        <div className="border-b border-line px-4 py-4 sm:px-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-accent-soft text-brand">
                <Filter className="size-4" strokeWidth={1.9} />
              </span>
              <div>
                <h2 className="text-sm font-bold">Filtros da carteira</h2>
                <p className="text-xs text-muted">Pesquise e refine os leads exibidos</p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-muted">
                {activeFilterCount} {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
              </span>
            )}
          </div>

          <form className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted">Buscar lead</span>
              <span className="relative block">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  name="busca"
                  defaultValue={filters.search}
                  placeholder="Nome, telefone ou e-mail"
                  className="h-11 w-full rounded-xl border border-line bg-background/55 pl-10 pr-4 text-sm transition-colors placeholder:text-muted/65 focus:border-brand/30 focus:bg-white focus:ring-2 focus:ring-accent/20"
                />
              </span>
            </label>

            <FilterSelect label="Status" name="status" defaultValue={filters.status}>
              <option value="">Todos os status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.slug}>{status.name}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Origem" name="origem" defaultValue={filters.source}>
              <option value="">Todas as origens</option>
              {sources.map((source) => (
                <option key={source.id} value={source.slug}>
                  {source.name}{source.active ? "" : " (inativa)"}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect label="Ordenar por" name="ordem" defaultValue={filters.order} icon={<ArrowDownUp className="size-4" />}>
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </FilterSelect>

            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-strong focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
              Aplicar filtros
            </button>
          </form>

          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Link href="/leads" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-brand">
                <X className="size-3.5" />
                Limpar filtros
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 border-b border-line bg-surface-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm font-semibold text-foreground">
            {formatLeadCount(total)}
          </p>
          <p className="text-xs text-muted">
            Ordenados do {filters.order === "recentes" ? "mais recente ao mais antigo" : "mais antigo ao mais recente"}
          </p>
        </div>

        {leads.length ? (
          <>
            <DesktopLeadList leads={leads} />
            <MobileLeadList leads={leads} />
          </>
        ) : (
          <EmptyLeads hasFilters={hasFilters} />
        )}
      </section>
    </>
  );
}

function DesktopLeadList({ leads }: { leads: LeadsListItem[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <div className="min-w-[920px]" role="table" aria-label="Lista de leads">
        <div
          role="row"
          className="grid grid-cols-[minmax(260px,1.5fr)_minmax(170px,1fr)_140px_130px_140px_105px] gap-4 border-b border-line px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
        >
          <span role="columnheader">Contato</span>
          <span role="columnheader">Interesse</span>
          <span role="columnheader">Origem</span>
          <span role="columnheader">Potencial</span>
          <span role="columnheader">Status</span>
          <span role="columnheader">Entrada</span>
        </div>
        <div role="rowgroup" className="divide-y divide-line">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              role="row"
              aria-label={`Abrir lead ${lead.name}`}
              className="group grid grid-cols-[minmax(260px,1.5fr)_minmax(170px,1fr)_140px_130px_140px_105px] items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/40 focus-visible:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <span role="cell" className="flex min-w-0 items-center gap-3">
                <LeadAvatar name={lead.name} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-foreground group-hover:text-brand">{lead.name}</span>
                    <ArrowRight className="size-3.5 shrink-0 -translate-x-1 text-brand opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{contactSummary(lead)}</span>
                </span>
              </span>
              <span role="cell" className="truncate text-sm font-medium text-foreground">{lead.interest}</span>
              <span role="cell" className="flex items-center gap-2 text-sm text-muted">
                <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate">{lead.source?.name ?? "Não informada"}</span>
              </span>
              <span role="cell" className="text-sm font-bold text-foreground">{formatCurrency(lead.budget)}</span>
              <span role="cell"><LeadStatusBadge lead={lead} /></span>
              <time role="cell" className="text-xs font-medium text-muted" dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLeadList({ leads }: { leads: LeadsListItem[] }) {
  return (
    <div className="divide-y divide-line md:hidden">
      {leads.map((lead) => (
        <Link
          key={lead.id}
          href={`/leads/${lead.id}`}
          aria-label={`Abrir lead ${lead.name}`}
          className="group block p-4 transition-colors hover:bg-surface-muted/40 focus-visible:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
        >
          <div className="flex items-start gap-3">
            <LeadAvatar name={lead.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-foreground group-hover:text-brand">{lead.name}</p>
                  {lead.company && <p className="mt-0.5 truncate text-xs font-medium text-muted">{lead.company}</p>}
                </div>
                <LeadStatusBadge lead={lead} />
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted">
                {lead.email && <p className="flex items-center gap-2 truncate"><Mail className="size-3.5 shrink-0" />{lead.email}</p>}
                {lead.phone && <p className="flex items-center gap-2"><Phone className="size-3.5 shrink-0" />{lead.phone}</p>}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs">
                <div><p className="text-muted">Interesse</p><p className="mt-0.5 truncate font-semibold text-foreground">{lead.interest}</p></div>
                <div className="text-right"><p className="text-muted">Potencial</p><p className="mt-0.5 font-bold text-foreground">{formatCurrency(lead.budget)}</p></div>
                <div><p className="text-muted">Origem</p><p className="mt-0.5 truncate font-semibold text-foreground">{lead.source?.name ?? "Não informada"}</p></div>
                <div className="text-right"><p className="text-muted">Entrada</p><time className="mt-0.5 block font-semibold text-foreground" dateTime={lead.createdAt}>{formatDate(lead.createdAt)}</time></div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FilterSelect({
  label,
  name,
  defaultValue,
  children,
  icon,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-muted">{label}</span>
      <span className="relative block">
        {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>}
        <select
          name={name}
          defaultValue={defaultValue}
          className={`h-11 w-full appearance-none rounded-xl border border-line bg-white pr-9 text-sm font-medium transition-colors focus:border-brand/30 focus:ring-2 focus:ring-accent/20 ${icon ? "pl-10" : "pl-3.5"}`}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted">▾</span>
      </span>
    </label>
  );
}

function LeadStatusBadge({ lead }: { lead: LeadsListItem }) {
  const color = safeColor(lead.status?.color);
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
      style={{ color, borderColor: `${color}35`, backgroundColor: `${color}12` }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate">{lead.status?.name ?? "Sem status"}</span>
    </span>
  );
}

function EmptyLeads({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center sm:py-20">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-muted"><UsersRound className="size-5" /></span>
      <h2 className="mt-4 font-bold">{hasFilters ? "Nenhum lead encontrado" : "Sua carteira ainda está vazia"}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted">
        {hasFilters ? "Tente ajustar a busca ou remover algum filtro aplicado." : "Adicione o primeiro lead para começar a organizar suas oportunidades."}
      </p>
      <Link
        href={hasFilters ? "/leads" : "/leads/novo"}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
      >
        {hasFilters ? <X className="size-4" /> : <Plus className="size-4" />}
        {hasFilters ? "Limpar filtros" : "Adicionar primeiro lead"}
      </Link>
    </div>
  );
}

function UnconfiguredLeads() {
  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Conecte seus leads ao Supabase" description="A listagem exibe somente dados reais e protegidos da sua conta." />
      <section className="rounded-3xl border border-line bg-white p-6 sm:p-9">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-brand"><DatabaseZap className="size-6" /></span>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.03em]">Dados reais, sem conteúdo de demonstração</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Configure as variáveis do Supabase, aplique as migrações do projeto e entre novamente para carregar sua carteira de leads.</p>
      </section>
    </>
  );
}

function LeadsError({ message }: { message: string }) {
  return (
    <>
      <PageHeader eyebrow="Relacionamento" title="Leads indisponíveis" description="Os dados reais não puderam ser carregados neste momento." />
      <section className="rounded-2xl border border-rose-200 bg-white p-6 sm:p-8">
        <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><CircleAlert className="size-5" /></span>
        <h2 className="mt-4 text-lg font-bold">Verifique a integração com o Supabase</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{message}</p>
        <Link href="/leads" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-strong">
          Tentar novamente <ArrowRight className="size-4" />
        </Link>
      </section>
    </>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function contactSummary(lead: LeadsListItem) {
  return [lead.company, lead.email, lead.phone].filter(Boolean).join(" · ") || "Sem contato informado";
}

function formatLeadCount(total: number) {
  return `${total.toLocaleString("pt-BR")} ${total === 1 ? "lead encontrado" : "leads encontrados"}`;
}

function safeColor(color: string | undefined) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}
