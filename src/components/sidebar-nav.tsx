"use client";

import {
  ChartNoAxesCombined,
  ContactRound,
  LayoutDashboard,
  ListTodo,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: ContactRound },
  { href: "/pipeline", label: "Pipeline", icon: ChartNoAxesCombined },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Navegação principal">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              active
                ? "bg-white/11 text-white"
                : "text-white/58 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Icon className={`size-[18px] ${active ? "text-accent" : ""}`} strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
      <div className="my-4 h-px bg-white/8" />
      <Link
        href="/configuracoes"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
          pathname.startsWith("/configuracoes")
            ? "bg-white/11 text-white"
            : "text-white/58 hover:bg-white/6 hover:text-white"
        }`}
      >
        <Settings className="size-[18px]" strokeWidth={1.8} />
        Configurações
      </Link>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border border-white/10 bg-brand-strong/95 px-2 py-2 shadow-2xl backdrop-blur-xl lg:hidden">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors ${active ? "text-accent" : "text-white/55"}`}
          >
            <Icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
            {label === "Visão geral" ? "Início" : label}
          </Link>
        );
      })}
    </nav>
  );
}
