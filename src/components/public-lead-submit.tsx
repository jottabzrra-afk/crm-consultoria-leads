"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function PublicLeadSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-strong disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
      {pending ? "Enviando informações..." : "Quero receber um contato"}
    </button>
  );
}
