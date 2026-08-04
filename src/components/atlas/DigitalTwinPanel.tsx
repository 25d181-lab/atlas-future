import { motion } from "motion/react";
import { Brain, CloudRain, TrendingDown, WarehouseIcon } from "lucide-react";
import { useAtlas } from "@/lib/atlas-store";

const TONES = {
  good: "border-leaf/40 bg-leaf/10 text-leaf",
  warn: "border-warn/40 bg-warn/10 text-warn",
  bad: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

const ICONS = [CloudRain, TrendingDown, WarehouseIcon];

export function DigitalTwinPanel() {
  const plan = useAtlas((s) => s.plan);

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
        <Brain className="size-5 text-gold" /> Digital Twin — what-if simulations
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Simulated futures for this exact lot. 5,000 Monte-Carlo passes over price, weather and capacity.
      </p>

      {!plan ? (
        <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          Simulations appear once the Digital Twin agent runs.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {plan.scenarios.map((sc, i) => {
            const Icon = ICONS[i] ?? CloudRain;
            return (
              <motion.article
                key={sc.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-4 ${TONES[sc.tone]}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <h3 className="text-sm font-semibold">{sc.name}</h3>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="opacity-80">Probability</span>
                    <span className="font-semibold">{Math.round(sc.probability * 100)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/60">
                    <motion.div
                      className="h-full rounded-full bg-current"
                      initial={{ width: 0 }}
                      animate={{ width: `${sc.probability * 100}%` }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-[12px] leading-relaxed text-foreground/90">{sc.impact}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground/80">Mitigation: </span>
                  {sc.mitigation}
                </p>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
