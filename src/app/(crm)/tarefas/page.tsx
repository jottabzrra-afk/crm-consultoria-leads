import { CalendarCheck2, Check, CircleAlert, Clock3, DatabaseZap, Plus } from "lucide-react";
import { createTaskAction, toggleTaskAction } from "@/app/actions";
import { Field, inputClass } from "@/components/form-fields";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format";
import { getTasksPageData } from "@/lib/tasks";

export const metadata = { title: "Tarefas" };
export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const [result, params] = await Promise.all([getTasksPageData(), searchParams]);
  if (result.state === "unconfigured") return <TasksState icon={DatabaseZap} title="Conecte as tarefas ao Supabase" description="Configure as variáveis e aplique as migrações para carregar follow-ups reais." />;
  if (result.state === "error") return <TasksState icon={CircleAlert} title="Tarefas indisponíveis" description={result.message} error />;

  const { tasks, leads } = result.data;
  const pending = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  return (
    <>
      <PageHeader eyebrow="Follow-up" title="Tarefas" description="Organize contatos e compromissos para manter cada oportunidade em movimento." />
      {params.erro && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.erro}</div>}
      {params.sucesso && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{params.sucesso}</div>}
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
            <Field label="Atividade"><input name="title" required maxLength={240} placeholder="Ex.: Ligar para o decisor" className={inputClass} /></Field>
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

function TasksState({ icon: Icon, title, description, error = false }: { icon: typeof DatabaseZap; title: string; description: string; error?: boolean }) {
  return <><PageHeader eyebrow="Follow-up" title="Tarefas" description="Os follow-ups são carregados diretamente do Supabase." /><section className={`rounded-2xl border bg-white p-6 sm:p-8 ${error ? "border-rose-200" : "border-line"}`}><span className={`grid size-11 place-items-center rounded-2xl ${error ? "bg-rose-50 text-rose-700" : "bg-accent-soft text-brand"}`}><Icon className="size-5" /></span><h2 className="mt-4 text-lg font-bold">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></section></>;
}
