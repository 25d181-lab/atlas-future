import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Globe2, TriangleAlert, Store, Layers3 } from "lucide-react";
import { runRegionalIntelligence } from "@/lib/atlas-intelligence";
import { ExplainCard } from "./ExplainCard";
import { useT } from "@/lib/i18n";

type LayerKey = "demand" | "supply" | "suitability" | "diseasePressure";

const LAYERS: { key: LayerKey; tkey: string; hue: string }[] = [
  { key: "demand", tkey: "demand", hue: "45 92% 55%" },
  { key: "supply", tkey: "supply", hue: "150 62% 45%" },
  { key: "suitability", tkey: "cropSuitability", hue: "190 80% 52%" },
  { key: "diseasePressure", tkey: "diseasePressure", hue: "0 72% 55%" },
];

const SEVERITY = {
  info: "border-border bg-surface-2/50 text-muted-foreground",
  warn: "border-warn/40 bg-warn/10 text-warn",
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

export function RegionalIntelligencePanel() {
  const tr = useT();
  const [layer, setLayer] = useState<LayerKey>("demand");
  const intel = useMemo(() => runRegionalIntelligence(), []);
  const active = LAYERS.find((l) => l.key === layer)!;

  return (
    <section className="panel p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
          <Globe2 className="size-5 text-gold" /> {tr("regionalEngine")}
        </h2>
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
          {tr("taluksLive", { count: intel.cells.length })}
        </span>
      </header>
      <p className="mt-1 text-xs text-muted-foreground">
        {tr("regionalSub")}
      </p>

      {/* Layer switcher */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Layers3 className="size-4 text-muted-foreground" />
        {LAYERS.map((l) => (
          <button
            key={l.key}
            onClick={() => setLayer(l.key)}
            className={`rounded-full border px-3 py-1 text-[11px] transition ${
              layer === l.key ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tr(l.tkey)}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {intel.cells.map((c, i) => {
          const v = c[layer];
          return (
            <motion.div
              key={c.taluk}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="relative overflow-hidden rounded-xl border border-border p-3"
              style={{ background: `hsl(${active.hue} / ${0.08 + (v / 100) * 0.42})` }}
            >
              <p className="text-[12px] font-semibold text-foreground">{c.taluk}</p>
              <p className="text-[10px] text-muted-foreground">{c.dominantCrop}</p>
              <p className="mt-2 text-xl font-bold" style={{ color: `hsl(${active.hue})` }}>
                {v}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{tr(active.tkey)}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-lg border border-destructive/30 bg-destructive/10 px-2 py-1 text-destructive">
          {tr("oversupply")}: {intel.oversupplied.join(", ") || tr("none")}
        </span>
        <span className="rounded-lg border border-leaf/30 bg-leaf/10 px-2 py-1 text-leaf">
          {tr("demandGaps")}: {intel.undersupplied.join(", ") || tr("none")}
        </span>
      </div>

      {/* Alerts */}
      <div className="mt-5 grid gap-2 lg:grid-cols-2">
        {intel.alerts.map((a) => (
          <div key={a.title} className={`rounded-xl border p-3 ${SEVERITY[a.severity]}`}>
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <TriangleAlert className="size-3.5" /> {a.title}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{a.detail}</p>
            <p className="mt-1.5 text-[11px] opacity-80">→ {a.action}</p>
          </div>
        ))}
      </div>

      {/* Market opportunities */}
      <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Store className="size-4 text-gold" /> {tr("marketOpportunities")}
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[12px]">
          <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="pb-2">{tr("buyer")}</th>
              <th className="pb-2">{tr("crop")}</th>
              <th className="pb-2">{tr("volume")}</th>
              <th className="pb-2">{tr("price")}</th>
              <th className="pb-2">{tr("window")}</th>
              <th className="pb-2">{tr("confidence")}</th>
            </tr>
          </thead>
          <tbody>
            {intel.opportunities.map((o) => (
              <tr key={o.buyerType} className="border-t border-border/60">
                <td className="py-2 font-medium text-foreground">{o.buyerType}</td>
                <td className="py-2 text-muted-foreground">{o.crop}</td>
                <td className="py-2 text-muted-foreground">{o.volumeTonnes} t</td>
                <td className="py-2 font-semibold text-gold">₹{o.pricePerKg}/kg</td>
                <td className="py-2 text-muted-foreground">{o.window}</td>
                <td className="py-2 text-leaf">{Math.round(o.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ExplainCard explanation={intel.explanation} label={tr("howRegionScored")} />
    </section>
  );
}
