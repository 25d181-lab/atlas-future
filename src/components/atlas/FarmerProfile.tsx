import { History, ShieldCheck, Sprout, User } from "lucide-react";
import { DECISION_HISTORY, FARMER, inr } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";
import { useT } from "@/lib/i18n";

export function FarmerProfile() {
  const runs = useAtlas((s) => s.runs);
  const tr = useT();

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-gradient-gold">
        <User className="size-5 text-gold" /> {tr("farmerProfile")}
      </h2>

      <div className="mt-4 flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-leaf/20 text-xl">👨‍🌾</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{FARMER.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {FARMER.village} · {FARMER.landAcres} acres · {FARMER.phone}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Chip icon={Sprout} label={tr("crops")} value={String(FARMER.crops.length)} />
        <Chip icon={ShieldCheck} label={tr("trustScore")} value={`${FARMER.trustScore}/100`} />
        <Chip icon={History} label={tr("withAtlas")} value={FARMER.atlasSince} />
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">{tr("decisionHistory")}</p>
      <div className="mt-2 space-y-2">
        {runs.map((r) => (
          <div key={r.id} className="rounded-lg border border-gold/40 bg-gold/10 p-2.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {r.tonnes} t {r.crop} · {r.mandi}
              </span>
              <span className="text-gold">₹{r.price}/kg</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {r.at} · {tr("net")} {inr(r.net)} · {tr("executedJustNow")}
            </p>
          </div>
        ))}
        {DECISION_HISTORY.map((d) => (
          <div key={d.id} className="rounded-lg border border-border bg-surface-2/40 p-2.5 text-xs">
            <div className="flex justify-between gap-2">
              <span className="font-medium">
                {d.qty} {d.crop} · {d.mandi}
              </span>
              <span className="text-leaf">{d.gain}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {d.date} · {d.price} · {d.status}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Chip({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <Icon className="size-3.5 text-gold" />
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}
