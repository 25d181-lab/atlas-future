import { AnimatePresence, motion } from "motion/react";
import {
  Bot,
  Brain,
  CheckCircle2,
  Leaf,
  Loader2,
  Shield,
  Store,
  Truck,
  Warehouse as WarehouseIcon,
  Handshake,
} from "lucide-react";
import { AGENTS, type AgentKey } from "@/lib/atlas-agents";
import { useAtlas } from "@/lib/atlas-store";
import { useT } from "@/lib/i18n";

const ICONS: Record<AgentKey, typeof Leaf> = {
  agroguard: Leaf,
  demand: Store,
  negotiation: Handshake,
  warehouse: WarehouseIcon,
  logistics: Truck,
  insurance: Shield,
  twin: Brain,
};

export function AgentPipeline() {
  const { statuses, plan, phase } = useAtlas();
  const tr = useT();
  const done = AGENTS.filter((a) => statuses[a.key] === "done").length;

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
            <Bot className="size-5 text-gold" /> {tr("pipelineTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {tr("pipelineSub")}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          {done}/{AGENTS.length} {tr("complete")}
        </span>
      </div>

      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-leaf to-gold"
          animate={{ width: `${(done / AGENTS.length) * 100}%` }}
          transition={{ ease: "easeOut" }}
        />
      </div>

      <div className="space-y-2.5">
        {AGENTS.map((agent, i) => {
          const status = statuses[agent.key];
          const Icon = ICONS[agent.key];
          const result = plan?.results[agent.key];
          const showResult = status === "done" && result;

          return (
            <motion.div
              key={agent.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border p-3 transition-colors ${
                status === "running"
                  ? "border-leaf/60 bg-leaf/10 shadow-glow-leaf"
                  : status === "done"
                    ? "border-border bg-surface-2/50"
                    : "border-border/60 bg-background/30 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${
                    status === "done"
                      ? "bg-leaf/20 text-leaf"
                      : status === "running"
                        ? "bg-gold/20 text-gold pulse-ring"
                        : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tr(`agent.${agent.key}`)}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{tr(`agent.${agent.key}.role`)}</p>
                </div>
                {status === "running" && <Loader2 className="size-4 animate-spin text-gold" />}
                {status === "done" && <CheckCircle2 className="size-4 text-leaf" />}
              </div>

              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 border-t border-border/70 pt-3">
                      <p className="text-sm font-medium text-leaf">{result.headline}</p>
                      <ul className="mt-2 space-y-1">
                        {result.reasoning.map((r) => (
                          <li key={r} className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold-soft" />
                            {r}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.metrics.map((m) => (
                          <div key={m.label} className="rounded-lg bg-background/60 px-2.5 py-1.5">
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                            <p className="text-xs font-semibold text-foreground">{m.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {phase === "idle" && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {tr("wakeAgents")}
        </p>
      )}
    </section>
  );
}
