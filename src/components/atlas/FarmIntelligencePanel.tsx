import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sprout, Droplets, ShieldAlert, BadgeIndianRupee, Clock, Landmark } from "lucide-react";
import { DEFAULT_FARM, runFarmIntelligence, type FarmProfile } from "@/lib/atlas-intelligence";
import { inr } from "@/lib/atlas-data";
import { ExplainCard } from "./ExplainCard";
import { useT } from "@/lib/i18n";

const RISK_TONE = {
  Low: "border-leaf/40 bg-leaf/10 text-leaf",
  Moderate: "border-gold/40 bg-gold/10 text-gold",
  High: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

const WATER_SOURCES: FarmProfile["waterSource"][] = ["Borewell", "Canal", "Tank", "Rain-fed"];
const IRRIGATION: FarmProfile["irrigation"][] = ["Drip", "Sprinkler", "Flood", "None"];

export function FarmIntelligencePanel() {
  const tr = useT();
  const [farm, setFarm] = useState<FarmProfile>(DEFAULT_FARM);
  const recs = useMemo(() => runFarmIntelligence(farm), [farm]);

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
          <Sprout className="size-5 text-leaf" /> {tr("farmEngine")}
        </h2>
        <span className="rounded-full border border-leaf/30 bg-leaf/10 px-2 py-0.5 text-[11px] text-leaf">{tr("preSowing")}</span>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">
        {tr("farmEngineSub")}
      </p>

      {/* Farm parameters — every change re-runs the engine */}
      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-surface-2/40 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={tr("landAcres")}>
          <input
            type="range" min={0.5} max={12} step={0.5} value={farm.landAcres}
            onChange={(e) => setFarm({ ...farm, landAcres: Number(e.target.value) })}
            className="w-full accent-[hsl(var(--gold,45_90%_55%))]"
          />
          <span className="text-xs font-semibold text-gold">{farm.landAcres} {tr("acres")}</span>
        </Field>
        <Field label={tr("waterSource")}>
          <Chips options={WATER_SOURCES} value={farm.waterSource} onChange={(v) => setFarm({ ...farm, waterSource: v })} label={tr} />
        </Field>
        <Field label={tr("irrigation")}>
          <Chips options={IRRIGATION} value={farm.irrigation} onChange={(v) => setFarm({ ...farm, irrigation: v })} label={tr} />
        </Field>
        <Field label={tr("previousCrop")}>
          <Chips
            options={["Tomato", "Onion", "Ragi", "Beans"]}
            value={farm.previousCrop}
            onChange={(v) => setFarm({ ...farm, previousCrop: v })}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {recs.map((r, i) => (
          <motion.article
            key={r.crop}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-border bg-surface-2/50 p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{r.emoji}</span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{r.crop}</h3>
                <p className="text-[11px] text-muted-foreground">{tr("rank")} #{i + 1} · {r.durationDays} {tr("dayCycle")}</p>
              </div>
              <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] ${RISK_TONE[r.riskLevel]}`}>
                {tr(r.riskLevel)} {tr("risk")}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{tr("suitabilityScore")}</span>
                <span className="font-semibold text-gold">{r.suitability}/100</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background/70">
                <motion.div className="h-full rounded-full bg-gold" initial={{ width: 0 }} animate={{ width: `${r.suitability}%` }} />
              </div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <Stat icon={Sprout} label={tr("yield")} value={`${r.expectedYieldTonnes} t`} />
              <Stat icon={BadgeIndianRupee} label={tr("profit")} value={inr(r.expectedProfit)} />
              <Stat icon={Droplets} label={tr("water")} value={r.waterRequirement} />
              <Stat icon={Clock} label={tr("harvest")} value={`${r.durationDays}d`} />
            </dl>

            <p className="mt-3 flex gap-2 text-[12px] text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warn" />
              {r.diseaseRisk}
            </p>
            <p className="mt-2 flex gap-2 text-[12px] text-muted-foreground">
              <Landmark className="mt-0.5 size-3.5 shrink-0 text-leaf" />
              {r.governmentBenefit}
            </p>

            <ExplainCard explanation={r.explanation} label={tr("whyCrop", { crop: r.crop })} />
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Chips<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label?: (k: string) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
            value === o ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {label ? label(o) : o}
        </button>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-1.5">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3" /> {label}
      </dt>
      <dd className="text-[13px] font-semibold text-foreground">{value}</dd>
    </div>
  );
}
