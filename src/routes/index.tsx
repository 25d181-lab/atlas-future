import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Building2, Sprout } from "lucide-react";
import { ChatPanel } from "@/components/atlas/ChatPanel";
import { AgentPipeline } from "@/components/atlas/AgentPipeline";
import { DigitalTwinPanel } from "@/components/atlas/DigitalTwinPanel";
import { WarehousePanel } from "@/components/atlas/WarehousePanel";
import { ConfirmationCard } from "@/components/atlas/ConfirmationCard";
import { FarmerProfile } from "@/components/atlas/FarmerProfile";
import { AdminDashboard } from "@/components/atlas/AdminDashboard";
import { LanguageSwitcher } from "@/components/atlas/LanguageSwitcher";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATLAS — Decision Intelligence for Indian Agriculture" },
      {
        name: "description",
        content:
          "ATLAS is an AI digital workforce for farmers: one WhatsApp voice note triggers crop health, market, negotiation, warehouse, logistics and insurance agents.",
      },
      { property: "og:title", content: "ATLAS — Decision Intelligence for Indian Agriculture" },
      {
        property: "og:description",
        content: "ATLAS is an AI digital workforce for farmers: one WhatsApp voice note triggers crop health, market, negotiation, warehouse, logistics and insurance agents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AtlasPage,
});

type View = "farmer" | "admin";

function AtlasPage() {
  const [view, setView] = useState<View>("farmer");
  const tr = useT();

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
      <header className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-gold/15 text-2xl shadow-glow-gold">🌾</div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient-gold sm:text-3xl">ATLAS</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tr("tagline")}
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
        <LanguageSwitcher />
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface-2/60 p-1">
          {(
            [
              { id: "farmer", label: tr("farmerView"), icon: Sprout },
              { id: "admin", label: tr("adminView"), icon: Building2 },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition sm:text-sm ${
                view === t.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {view === t.id && (
                <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-gold" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <t.icon className="relative size-4" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        </div>
      </header>

      <p className="mb-6 rounded-xl border border-border bg-surface-2/40 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-medium text-gold">“The farmer doesn't operate AI. AI works for the farmer.”</span>{" "}
        · Demo mode: all market, warehouse, weather and logistics data is <span className="text-foreground">simulated</span> with realistic Karnataka figures.
      </p>

      {view === "farmer" ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <ChatPanel />
            <FarmerProfile />
          </div>
          <div className="space-y-4">
            <ConfirmationCard />
            <AgentPipeline />
            <DigitalTwinPanel />
            <WarehousePanel />
          </div>
        </div>
      ) : (
        <AdminDashboard />
      )}
    </main>
  );
}
