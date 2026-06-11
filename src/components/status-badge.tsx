import { leadStatusClasses, leadStatusLabels } from "@/lib/constants";
import type { LeadStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${leadStatusClasses[status]}`}>
      {leadStatusLabels[status]}
    </span>
  );
}
