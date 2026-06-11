export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-brand/60">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
