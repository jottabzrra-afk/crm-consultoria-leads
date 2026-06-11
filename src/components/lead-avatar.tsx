import { initials } from "@/lib/format";

const colors = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
];

export function LeadAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const color = colors[name.charCodeAt(0) % colors.length];
  const sizes = { sm: "size-8 text-[10px]", md: "size-10 text-xs", lg: "size-14 text-sm" };
  return (
    <span className={`grid shrink-0 place-items-center rounded-full font-bold ${color} ${sizes[size]}`}>
      {initials(name)}
    </span>
  );
}
