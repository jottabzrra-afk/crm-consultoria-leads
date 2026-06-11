export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (absoluteSeconds < 60) return "agora";
  if (absoluteSeconds < 3600) return formatter.format(Math.round(diffInSeconds / 60), "minute");
  if (absoluteSeconds < 86400) return formatter.format(Math.round(diffInSeconds / 3600), "hour");
  if (absoluteSeconds < 604800) return formatter.format(Math.round(diffInSeconds / 86400), "day");
  return formatDate(value, true);
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
