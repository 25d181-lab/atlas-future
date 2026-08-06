import { motion } from "motion/react";
import { BadgeCheck, Coins, Leaf, Lock } from "lucide-react";
import { inr } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";
import { useT } from "@/lib/i18n";

export function ConfirmationCard() {
  const { plan, phase, approve } = useAtlas();
  const tr = useT();
  if (!plan || (phase !== "awaiting" && phase !== "confirmed")) return null;

  const e = plan.economics;
  const locked = phase === "confirmed";

  const actions = [
    { label: tr("buyer"), value: `${plan.mandi.name} @ ₹${e.negotiatedPerKg}/kg` },
    { label: tr("storage"), value: `${plan.warehouse.name} · 2 ${tr("days")}` },
    { label: tr("transport"), value: `${plan.transporter.name} · ${plan.transporter.vehicle}` },
    { label: tr("insurance"), value: tr("claimPack") },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`panel p-5 ${locked ? "shadow-glow-leaf" : "shadow-glow-gold"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {locked ? <Lock className="size-5 text-leaf" /> : <BadgeCheck className="size-5 text-gold" />}
        <h2 className="text-lg font-semibold text-gradient-gold">
          {locked ? tr("planLocked") : tr("planAwaiting")}
        </h2>
        <span
          className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${
            locked ? "bg-leaf/20 text-leaf" : "bg-gold/20 text-gold"
          }`}
        >
          {locked ? tr("executed") : tr("pendingOk")}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.summary}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <div key={a.label} className="rounded-xl border border-border bg-surface-2/50 p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.label}</p>
            <p className="mt-0.5 text-sm font-medium">{a.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat icon={Coins} label={tr("estimatedNet")} value={inr(e.netRevenue)} />
        <Stat icon={Leaf} label={tr("extraIncome")} value={`+${inr(e.extraIncome)}`} />
        <Stat icon={BadgeCheck} label={tr("wasteAvoided")} value={`${e.wasteAvoidedKg} kg`} />
      </div>

      {!locked && (
        <button
          onClick={approve}
          className="mt-4 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {tr("approveExecute")}
        </button>
      )}
    </motion.section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <Icon className="size-4 text-gold" />
      <p className="mt-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
