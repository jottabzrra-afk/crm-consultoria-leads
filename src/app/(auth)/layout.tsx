import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-brand-strong p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full border border-white/5" />
        <div className="absolute -right-10 -top-10 size-52 rounded-full border border-white/5" />
        <Brand />
        <div className="relative max-w-lg">
          <span className="inline-flex rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">CRM para negócios de serviço</span>
          <p className="mt-6 text-5xl font-bold leading-[1.08] tracking-[-0.055em]">Mais contexto.<br />Mais follow-up.<br /><span className="text-accent">Mais negócios.</span></p>
          <p className="mt-6 max-w-md text-base leading-7 text-white/55">Centralize os leads que chegam das suas landing pages e transforme interesse em conversas comerciais consistentes.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-white/8 pt-6"><AuthMetric value="1 lugar" label="para todos os leads" /><AuthMetric value="5 etapas" label="no pipeline visual" /><AuthMetric value="100%" label="foco em follow-up" /></div>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-background px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 lg:hidden"><span className="inline-flex rounded-xl bg-brand-strong p-2"><Brand /></span></div>
          {children}
        </div>
      </section>
    </main>
  );
}

function AuthMetric({ value, label }: { value: string; label: string }) {
  return <div><p className="text-lg font-bold text-white">{value}</p><p className="mt-1 text-xs text-white/40">{label}</p></div>;
}
