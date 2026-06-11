import type { LeadStatus } from "@/lib/types";

export const pipelineStages: Array<{
  id: LeadStatus;
  label: string;
  dot: string;
}> = [
  { id: "novo", label: "Novo lead", dot: "bg-sky-500" },
  { id: "contato-feito", label: "Contato feito", dot: "bg-indigo-500" },
  { id: "qualificado", label: "Qualificado", dot: "bg-cyan-600" },
  { id: "proposta", label: "Proposta enviada", dot: "bg-amber-500" },
  { id: "fechado", label: "Fechado", dot: "bg-emerald-600" },
  { id: "perdido", label: "Perdido", dot: "bg-rose-600" },
];

export const leadStatusLabels: Record<LeadStatus, string> = {
  novo: "Novo lead",
  "contato-feito": "Contato feito",
  qualificado: "Qualificado",
  proposta: "Proposta enviada",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const leadStatusClasses: Record<LeadStatus, string> = {
  novo: "bg-sky-50 text-sky-700 ring-sky-200",
  "contato-feito": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  qualificado: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  proposta: "bg-amber-50 text-amber-700 ring-amber-200",
  fechado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  perdido: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const serviceOptions = [
  "Consultoria estratégica",
  "Gestão de tráfego",
  "Desenvolvimento web",
  "Assessoria financeira",
  "Outro serviço",
];
