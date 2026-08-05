import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Info, Layers, ShieldCheck } from "lucide-react";
import type { Explanation } from "@/lib/atlas-intelligence";

/**
 * Reusable Explainable-AI disclosure.
 * Every ATLAS recommendation renders one of these: why, alternatives,
 * confidence and the data sources behind the call.
 */
export function ExplainCard({ explanation, label = "Why this recommendation?" }: { explanation: Explanation; label?: string }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(explanation.confidence * 100);

  return (
    <div className="mt-3 rounded-xl border border-border/70 bg-surface-2/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-foreground/90"
      >
        <Info className="size-3.5 text-gold" />
        {label}
        <span className="ml-auto flex items-center gap-2">
          <ConfidenceMeter value={explanation.confidence} compact />
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-border/60 px-3 py-3 text-[12px] leading-relaxed">
              <div>
                <p className="mb-1 font-semibold text-gold">Reasoning</p>
                <ul className="space-y-1 text-muted-foreground">
                  {explanation.why.map((w) => (
                    <li key={w} className="flex gap-2">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-leaf" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-gold">
                  <Layers className="size-3.5" /> Alternatives considered
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {explanation.alternatives.map((a) => (
                    <li key={a}>· {a}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-1 flex items-center gap-1.5 font-semibold text-gold">
                  <ShieldCheck className="size-3.5" /> Supporting data ({pct}% confidence)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {explanation.sources.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-background/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ConfidenceMeter({ value, compact = false }: { value: number; compact?: boolean }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 80 ? "bg-leaf" : pct >= 60 ? "bg-gold" : "bg-warn";
  return (
    <span className="flex items-center gap-1.5">
      <span className={`${compact ? "w-12" : "w-24"} h-1.5 overflow-hidden rounded-full bg-background/70`}>
        <motion.span
          className={`block h-full rounded-full ${tone}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground">{pct}%</span>
    </span>
  );
}
