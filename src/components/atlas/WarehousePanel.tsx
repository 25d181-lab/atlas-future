import { motion } from "motion/react";
import { MapPin, Snowflake } from "lucide-react";
import { WAREHOUSES, inr } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";

export function WarehousePanel() {
  const plan = useAtlas((s) => s.plan);
  const reservedId = plan?.warehouse.id;

  return (
    <section className="panel p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
            <Snowflake className="size-5 text-gold" /> Warehouse network
          </h2>
          <p className="text-xs text-muted-foreground">Live capacity across the Kolar–Bengaluru cold chain (simulated).</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {WAREHOUSES.map((w, i) => {
          const pct = Math.round((w.usedTonnes / w.capacityTonnes) * 100);
          const reserved = w.id === reservedId;
          const bar = pct > 92 ? "bg-destructive" : pct > 75 ? "bg-warn" : "bg-leaf";
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-3 ${reserved ? "border-gold/60 bg-gold/10 shadow-glow-gold" : "border-border bg-surface-2/40"}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className={`size-4 ${reserved ? "text-gold" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">{w.name}</p>
                <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  {w.type} · {w.distanceKm} km
                </span>
                {reserved && (
                  <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Reserved by ATLAS
                  </span>
                )}
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-background/60">
                <motion.div
                  className={`h-full rounded-full ${bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                <span>
                  {w.usedTonnes}/{w.capacityTonnes} t used · {pct}%
                </span>
                <span>{inr(w.ratePerTonneDay)}/t/day</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
