import { CalendarCheck2, Check, Clock3, Plus } from "lucide-react";
import { createTaskAction, toggleTaskAction } from "@/app/actions";
import { Field, inputClass } from "@/components/form-fields";
import { PageHeader } from "@/components/page-header";
import { getLeads, getTasks } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Tarefas" };

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ modo?: string }> }) {
  const [tasks, leads, params] = await Promise.all([getTasks(), getLeads(), searchParams]);
  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  return (
    <>
      <PageHeader eyebrow="Follow-up" title="Tarefas" description="Organize contatos e compromissos para manter cada oportunidade em movimento." />
      {params.modo === "demo" && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Modo demonstração: conecte o Supabase para salvar alterações.</div>}
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-bold">Pendentes</h2><p className="mt-1 text-xs text-muted">{pending.length} atividade(s) aguardando ação</p></div><Clock3 className="size-5 text-muted" /></div>
          <div className="divide-y divide-line">
            {pending.map((task) => (
              <form key={task.id} action={toggleTaskAction} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-muted/35">
                <input type="hidden" name="task_id" value={task.id} /><input type="hidden" name="completed" value={String(task.completed)} />
                <button className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border border-line bg-white text-transparent hover:border-accent hover:text-accent" aria-label={`Concluir ${task.title}`}><Check className="size-3.5" /></button>
                <div className="min-w-0 flex-1"><p className="text-sm font-bold">{task.title}</p><p className="mt-1 text-xs text-muted">{task.lead?.name ?? "Tarefa geral"}</p></div>
                <div className="text-right"><p className="text-xs font-bold text-foreground">{formatDate(task.due_at, true)}</p><span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${task.priority === "alta" ? "bg-rose-50 text-rose-700" : task.priority === "media" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{task.priority}</span></div>
              </form>
            ))}
            {pending.length === 0 && <div className="py-14 text-center"><CalendarCheck2 className="mx-auto size-7 text-emerald-600" /><p className="mt-3 text-sm font-bold">Tudo em dia</p><p className="mt-1 text-xs text-muted">Você não tem tarefas pendentes.</p></div>}
          </div>
          {completed.length > 0 && <div className="border-t border-line bg-surface-muted/40 px-5 py-3 text-xs font-bold text-muted">{completed.length} tarefa(s) concluída(s)</div>}
        </section>

        <aside className="h-fit rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-brand"><Plus className="size-4" /></span><div><h2 className="font-bold">Nova tarefa</h2><p className="text-xs text-muted">Agende um próximo passo</p></div></div>
          <form action={createTaskAction} className="mt-5 space-y-4">
            <Field label="Atividade"><input name="title" required placeholder="Ex.: Ligar para o decisor" className={inputClass} /></Field>
            <Field label="Lead relacionado"><select name="lead_id" className={inputClass}><option value="">Tarefa geral</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></Field>
            <Field label="Data e hora"><input name="due_at" type="datetime-local" required className={inputClass} /></Field>
            <Field label="Prioridade"><select name="priority" className={inputClass}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></Field>
            <button className="h-11 w-full rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-strong">Adicionar tarefa</button>
          </form>
        </aside>
      </div>
    </>
  );
}
