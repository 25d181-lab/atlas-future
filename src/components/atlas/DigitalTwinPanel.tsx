import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Brain, Gauge, Leaf, TrendingUp, CloudRain, TrendingDown, WarehouseIcon } from "lucide-react";
import { useAtlas } from "@/lib/atlas-store";
import { inr } from "@/lib/atlas-data";
import { TWIN_LEVERS, simulateTwin, type TwinLever } from "@/lib/atlas-intelligence";
import { ExplainCard } from "./ExplainCard";

const TONES = {
  good: "border-leaf/40 bg-leaf/10 text-leaf",
  warn: "border-warn/40 bg-warn/10 text-warn",
  bad: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

const ICONS = [CloudRain, TrendingDown, WarehouseIcon];

const GOLD = "#e3b23c";
const LEAF = "#48c78e";
const RED = "#ef5f5f";
const BLUE = "#4bb3d4";

const HORIZONS = [
  { label: "Today", days: 1 },
  { label: "Tomorrow", days: 2 },
  { label: "3 days", days: 3 },
  { label: "5 days", days: 5 },
  { label: "7 days", days: 7 },
];

export function DigitalTwinPanel() {
  const plan = useAtlas((s) => s.plan);
  const [levers, setLevers] = useState<TwinLever[]>([]);
  const [horizonIdx, setHorizonIdx] = useState(2);

  const tonnes = plan?.request.tonnes ?? 2;
  const basePrice = plan?.economics.negotiatedPerKg ?? 24.5;
  const horizonDays = HORIZONS[horizonIdx]!.days;

  const sim = useMemo(
    () => simulateTwin({ tonnes, basePricePerKg: basePrice, levers, horizonDays }),
    [tonnes, basePrice, levers, horizonDays],
  );

  const toggle = (k: TwinLever) =>
    setLevers((ls) => (ls.includes(k) ? ls.filter((l) => l !== k) : [...ls, k]));

  const last = sim.series[sim.series.length - 1]!;

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
          <Brain className="size-5 text-gold" /> Digital Twin
        </h2>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
          Live simulation · {tonnes} t @ ₹{basePrice}/kg
        </span>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">
        A running model of this exact lot. Toggle a shock and every curve re-solves across the chosen horizon.
      </p>

      {/* Shock levers */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {TWIN_LEVERS.map((l) => {
          const on = levers.includes(l.key);
          return (
            <button
              key={l.key}
              onClick={() => toggle(l.key)}
              className={`rounded-full border px-3 py-1 text-[11px] transition ${
                on ? "border-gold/60 bg-gold/20 text-gold" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </button>
          );
        })}
        {levers.length > 0 && (
          <button onClick={() => setLevers([])} className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground">
            Reset
          </button>
        )}
      </div>

      {/* Timeline slider */}
      <div className="mt-4 rounded-xl border border-border bg-surface-2/40 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wide">Timeline</span>
          <span className="font-semibold text-gold">{HORIZONS[horizonIdx]!.label}</span>
        </div>
        <input
          type="range"
          min={0}
          max={HORIZONS.length - 1}
          step={1}
          value={horizonIdx}
          onChange={(e) => setHorizonIdx(Number(e.target.value))}
          className="mt-2 w-full accent-[#e3b23c]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {HORIZONS.map((h) => (
            <span key={h.label}>{h.label}</span>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Net at horizon" value={inr(sim.netAtHorizon)}
          delta={`${sim.deltaVsToday >= 0 ? "+" : "−"}${inr(Math.abs(sim.deltaVsToday))} vs today`}
          tone={sim.deltaVsToday >= 0 ? "good" : "bad"} />
        <Kpi icon={Gauge} label="Risk meter" value={`${sim.riskScore}/100`}
          delta={sim.riskScore > 60 ? "High exposure" : sim.riskScore > 35 ? "Watchlist" : "Contained"}
          tone={sim.riskScore > 60 ? "bad" : sim.riskScore > 35 ? "warn" : "good"} />
        <Kpi icon={CloudRain} label="Spoilage" value={`${last.spoilage}%`}
          delta={`${Math.round((tonnes * 1000 * last.spoilage) / 100).toLocaleString("en-IN")} kg at risk`}
          tone={last.spoilage > 15 ? "bad" : last.spoilage > 7 ? "warn" : "good"} />
        <Kpi icon={Leaf} label="Carbon footprint" value={`${sim.carbonKg} kg CO₂e`}
          delta={`Best sell day: ${sim.series[sim.bestDayIndex]!.day}`} tone="good" />
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <ChartCard title="Price path (₹/kg)">
          <AreaChart data={sim.series}>
            <defs>
              <linearGradient id="twinPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.5} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ChartAxes />
            <Area type="monotone" dataKey="price" stroke={GOLD} strokeWidth={2} fill="url(#twinPrice)" isAnimationActive />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Demand index">
          <AreaChart data={sim.series}>
            <defs>
              <linearGradient id="twinDemand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LEAF} stopOpacity={0.5} />
                <stop offset="100%" stopColor={LEAF} stopOpacity={0} />
              </linearGradient>
            </defs>
            <ChartAxes />
            <Area type="monotone" dataKey="demand" stroke={LEAF} strokeWidth={2} fill="url(#twinDemand)" />
          </AreaChart>
        </ChartCard>

        <ChartCard title="Expected net profit (₹)">
          <LineChart data={sim.series}>
            <ChartAxes />
            <Line type="monotone" dataKey="profit" stroke={BLUE} strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Cold-chain free capacity % vs spoilage %">
          <LineChart data={sim.series}>
            <ChartAxes />
            <Line type="monotone" dataKey="warehouseFreePct" stroke={LEAF} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="spoilage" stroke={RED} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartCard>
      </div>

      <ExplainCard explanation={sim.explanation} label="Why this simulation outcome?" />

      {/* Agent-generated scenario cards (existing behaviour preserved) */}
      {plan && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-foreground">Monte-Carlo scenario briefs</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
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
                    <h4 className="text-sm font-semibold">{sc.name}</h4>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="opacity-80">Probability</span>
                      <span className="font-semibold">{Math.round(sc.probability * 100)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/60">
                      <motion.div className="h-full rounded-full bg-current" initial={{ width: 0 }} animate={{ width: `${sc.probability * 100}%` }} />
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
        </>
      )}
    </section>
  );
}

function ChartAxes() {
  return (
    <>
      <CartesianGrid stroke="hsl(0 0% 100% / 0.06)" vertical={false} />
      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.45)" }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 10, fill: "hsl(0 0% 100% / 0.45)" }} axisLine={false} tickLine={false} width={44} />
      <Tooltip
        contentStyle={{
          background: "rgba(10,15,10,0.92)",
          border: "1px solid rgba(227,178,60,0.35)",
          borderRadius: 12,
          fontSize: 12,
        }}
        labelStyle={{ color: "#e3b23c" }}
      />
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-3">
      <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, delta, tone,
}: { icon: React.ElementType; label: string; value: string; delta: string; tone: "good" | "warn" | "bad" }) {
  const toneCls = tone === "good" ? "text-leaf" : tone === "warn" ? "text-warn" : "text-destructive";
  return (
    <motion.div layout className="rounded-xl border border-border bg-surface-2/50 p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-1 text-base font-bold text-foreground">{value}</p>
      <p className={`text-[11px] ${toneCls}`}>{delta}</p>
    </motion.div>
  );
}
