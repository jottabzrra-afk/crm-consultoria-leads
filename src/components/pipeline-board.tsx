"use client";

import { ArrowUpRight, GripVertical, Mail, MoveRight, Phone } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type DragEvent } from "react";
import { movePipelineLeadAction } from "@/app/(crm)/pipeline/actions";
import { LeadAvatar } from "@/components/lead-avatar";
import { formatCurrency, formatRelativeDate } from "@/lib/format";
import type { PipelineLead, PipelineStatus } from "@/lib/pipeline";

export function PipelineBoard({
  initialLeads,
  statuses,
}: {
  initialLeads: PipelineLead[];
  statuses: PipelineStatus[];
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropStatusId, setDropStatusId] = useState<string | null>(null);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function moveLead(leadId: string, statusId: string) {
    const lead = leads.find((item) => item.id === leadId);
    if (!lead || lead.statusId === statusId || savingLeadId === leadId) return;

    const previousStatusId = lead.statusId;
    setError(null);
    setSavingLeadId(leadId);
    setLeads((current) => current.map((item) => item.id === leadId ? { ...item, statusId } : item));

    startTransition(async () => {
      const result = await movePipelineLeadAction(leadId, statusId);
      if (!result.success) {
        setLeads((current) => current.map((item) => item.id === leadId ? { ...item, statusId: previousStatusId } : item));
        setError(result.error ?? "Não foi possível mover o lead.");
      }
      setSavingLeadId(null);
    });
  }

  function beginDrag(event: DragEvent<HTMLElement>, leadId: string) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", leadId);
    setDraggedLeadId(leadId);
    setError(null);
  }

  function dropLead(event: DragEvent<HTMLElement>, statusId: string) {
    event.preventDefault();
    const leadId = event.dataTransfer.getData("text/plain") || draggedLeadId;
    if (leadId) moveLead(leadId, statusId);
    setDraggedLeadId(null);
    setDropStatusId(null);
  }

  return (
    <div className="relative">
      <div className="flex min-h-6 items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
        <p className="font-medium text-muted">Deslize horizontalmente para visualizar todas as etapas.</p>
        <div aria-live="polite" className="ml-4 shrink-0 font-bold">
          {error ? <span className="text-rose-700">{error}</span> : isPending ? <span className="text-brand">Salvando alteração...</span> : null}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto px-4 pb-5 sm:px-6 lg:px-8">
        <div className="grid min-w-max auto-cols-[minmax(280px,82vw)] grid-flow-col gap-3 sm:auto-cols-[300px] lg:gap-4">
          {statuses.map((status) => {
            const stageLeads = leads.filter((lead) => lead.statusId === status.id);
            const total = stageLeads.reduce((sum, lead) => sum + lead.budget, 0);
            const isDropTarget = dropStatusId === status.id && draggedLeadId !== null;

            return (
              <section
                key={status.id}
                onDragEnter={() => setDropStatusId(status.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropStatusId(null);
                }}
                onDrop={(event) => dropLead(event, status.id)}
                aria-label={`${status.name}: ${stageLeads.length} leads`}
                className={`flex min-h-[590px] snap-start flex-col rounded-3xl border p-3 transition-colors ${isDropTarget ? "border-accent bg-accent-soft/65" : "border-line/80 bg-[#e9ece5]"}`}
              >
                <header className="px-1 pb-3 pt-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: safeColor(status.color) }} />
                        <h2 className="truncate text-xs font-bold uppercase tracking-[0.08em] text-foreground/80">{status.name}</h2>
                        <span className="rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-bold text-muted">{stageLeads.length}</span>
                      </div>
                      <p className="mt-1.5 pl-[18px] text-[11px] font-semibold text-muted">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </header>

                <div className="flex-1 space-y-3">
                  {stageLeads.map((lead) => (
                    <article
                      key={lead.id}
                      draggable={savingLeadId !== lead.id}
                      onDragStart={(event) => beginDrag(event, lead.id)}
                      onDragEnd={() => {
                        setDraggedLeadId(null);
                        setDropStatusId(null);
                      }}
                      className={`group rounded-2xl border bg-white p-4 shadow-[0_2px_8px_rgba(20,61,53,0.05)] transition-[border-color,box-shadow,opacity] ${draggedLeadId === lead.id ? "border-accent opacity-45" : "border-line hover:border-brand/20 hover:shadow-[0_5px_18px_rgba(20,61,53,0.09)]"} ${savingLeadId === lead.id ? "opacity-65" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <LeadAvatar name={lead.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/leads/${lead.id}`} className="inline-flex max-w-full items-center gap-1 text-sm font-bold text-foreground transition-colors hover:text-brand">
                            <span className="truncate">{lead.name}</span>
                            <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                          <p className="mt-0.5 truncate text-[11px] text-muted">{lead.company ?? lead.interest}</p>
                        </div>
                        <GripVertical className="size-4 shrink-0 cursor-grab text-muted/45 active:cursor-grabbing" aria-hidden="true" />
                      </div>

                      <div className="mt-4 rounded-xl bg-background/65 px-3 py-2.5">
                        <p className="truncate text-[11px] font-medium text-muted">{lead.interest}</p>
                        <div className="mt-1.5 flex items-baseline justify-between gap-3">
                          <p className="text-sm font-bold text-brand">{formatCurrency(lead.budget)}</p>
                          <p className="text-[10px] font-medium text-muted">{formatRelativeDate(lead.updatedAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5">
                        {lead.email && <a href={`mailto:${lead.email}`} aria-label={`Enviar e-mail para ${lead.name}`} className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-muted hover:text-brand"><Mail className="size-3.5" /></a>}
                        {lead.phone && <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label={`Abrir WhatsApp de ${lead.name}`} className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-muted hover:text-brand"><Phone className="size-3.5" /></a>}
                        <label className="ml-auto flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-muted">
                          <MoveRight className="size-3.5 shrink-0" />
                          <span className="sr-only">Mover {lead.name} para</span>
                          <select
                            value={lead.statusId}
                            disabled={savingLeadId === lead.id}
                            onChange={(event) => moveLead(lead.id, event.target.value)}
                            className="max-w-32 min-w-0 rounded-lg border border-line bg-white px-2 py-1.5 text-[10px] font-bold text-brand focus:ring-2 focus:ring-accent/20"
                            aria-label={`Mover ${lead.name} para outra etapa`}
                          >
                            {statuses.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                          </select>
                        </label>
                      </div>
                    </article>
                  ))}

                  {stageLeads.length === 0 && (
                    <div className={`grid min-h-32 place-items-center rounded-2xl border border-dashed px-4 text-center text-xs leading-5 transition-colors ${isDropTarget ? "border-brand/35 bg-white/70 text-brand" : "border-brand/15 text-muted"}`}>
                      {isDropTarget ? "Solte o lead nesta etapa" : "Arraste uma oportunidade para cá"}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function safeColor(color: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#64748b";
}
