export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-foreground placeholder:text-muted/60 transition focus:border-brand/35 focus:ring-2 focus:ring-accent/20";

export const textareaClass =
  "min-h-28 w-full resize-y rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-foreground placeholder:text-muted/60 transition focus:border-brand/35 focus:ring-2 focus:ring-accent/20";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
