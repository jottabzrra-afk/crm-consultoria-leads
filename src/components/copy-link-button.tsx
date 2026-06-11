"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs font-bold text-brand transition-colors hover:bg-surface-muted">
      {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}
