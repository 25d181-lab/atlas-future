import { motion } from "motion/react";
import { AlertTriangle, Building2, Radio, TrendingUp, Users } from "lucide-react";
import {
  FPO_FARMERS,
  MANDIS,
  SWARM_ALERTS,
  WAREHOUSES,
  inr,
} from "@/lib/atlas-data";
import { WarehousePanel } from "./WarehousePanel";
import { useT } from "@/lib/i18n";

const STATUS_TONE: Record<string, string> = {
  "Awaiting approval": "bg-gold/20 text-gold",
  Executed: "bg-leaf/20 text-leaf",
  "In transit": "bg-warn/20 text-warn",
  Stored: "bg-surface-2 text-muted-foreground",
};

export function AdminDashboard() {
  const tr = useT();
  const totalTonnes = FPO_FARMERS.reduce((s, f) => s + f.tonnes, 0);
  const totalCapacity = WAREHOUSES.reduce((s, w) => s + w.capacityTonnes, 0);
  const usedCapacity = WAREHOUSES.reduce((s, w) => s + w.usedTonnes, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4">
        <Kpi icon={Users} label={tr("activeFarmers")} value="128" sub="Kolar Horticulture FPO" />
        <Kpi icon={Building2} label={tr("coldChainUsed")} value={`${Math.round((usedCapacity / totalCapacity) * 100)}%`} sub={`${usedCapacity} / ${totalCapacity} t`} />
        <Kpi icon={TrendingUp} label={tr("extraIncome30")} value={inr(742000)} sub={tr("vsLocalSale")} />
        <Kpi icon={AlertTriangle} label={tr("wasteAvoided30")} value="18.4 t" sub={tr("coldChainInterventions")} />
      </div>

      <section className="panel p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold text-gradient-gold">{tr("memberLots")}</h2>
        <p className="text-xs text-muted-foreground">{tr("memberLotsSub", { tonnes: totalTonnes.toFixed(1) })}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">{tr("farmer")}</th>
                <th className="pb-2 font-medium">{tr("village")}</th>
                <th className="pb-2 font-medium">{tr("crop")}</th>
                <th className="pb-2 font-medium">{tr("qty")}</th>
                <th className="pb-2 font-medium">{tr("status")}</th>
              </tr>
            </thead>
            <tbody>
              {FPO_FARMERS.map((f) => (
                <tr key={f.name} className="border-t border-border/70">
                  <td className="py-2.5">{f.name}</td>
                  <td className="py-2.5 text-muted-foreground">{f.village}</td>
                  <td className="py-2.5 text-muted-foreground">{f.crop}</td>
                  <td className="py-2.5">{f.tonnes} t</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${STATUS_TONE[f.status] ?? "bg-surface-2"}`}>
                      {tr(f.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
          <Radio className="size-5 text-gold" /> {tr("swarmAlerts")}
        </h2>
        <p className="text-xs text-muted-foreground">{tr("swarmSub")}</p>
        <div className="mt-4 space-y-3">
          {SWARM_ALERTS.map((a) => (
            <motion.div
              key={a.village}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-warn/40 bg-warn/10 p-3"
            >
              <p className="text-sm font-medium text-warn">{a.village}</p>
              <p className="mt-1 text-[12px] text-foreground/90">{a.issue}</p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {tr("farmersAlerted", { count: a.farmersNotified, km: a.radiusKm })}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="panel p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold text-gradient-gold">{tr("mandiBoard")}</h2>
        <p className="text-xs text-muted-foreground">{tr("mandiSub")}</p>
        <div className="mt-4 space-y-2.5">
          {MANDIS.map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {m.district} · {m.distanceKm} {tr("km")} · {tr("arrivals")} {m.arrivalsTonnes} t
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">₹{m.pricePerKg}/kg</p>
                <p className={`text-[11px] ${m.trend >= 0 ? "text-leaf" : "text-destructive"}`}>
                  {m.trend >= 0 ? "+" : ""}
                  {m.trend}% / 72h
                </p>
              </div>
              <div className="hidden w-24 sm:block">
                <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${m.demandIndex}%` }} />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{tr("demandLabel")} {m.demandIndex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:col-span-1">
        <WarehousePanel />
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="panel p-4">
      <Icon className="size-4 text-gold" />
      <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
