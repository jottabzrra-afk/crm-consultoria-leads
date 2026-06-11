import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="inline-flex items-center gap-3" aria-label="Nexo CRM">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-sm font-black text-brand-strong shadow-sm">
        N
      </span>
      {!compact && (
        <span className="text-[17px] font-bold tracking-[-0.03em] text-white">
          nexo<span className="font-medium text-white/55">crm</span>
        </span>
      )}
    </Link>
  );
}
