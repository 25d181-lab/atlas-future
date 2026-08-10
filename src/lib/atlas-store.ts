import { create } from "zustand";
import { AGENTS, buildPlan, parseRequest, type AgentKey, type AtlasPlan } from "./atlas-agents";
import type { FarmerDecision } from "./assistant.functions";
import { inr } from "./atlas-data";
import { t } from "./i18n";
import { agentBriefs, type AgentBriefs } from "./agents.functions";
import { useI18n } from "./i18n";

export type ChatMessage = {
  id: string;
  from: "farmer" | "atlas";
  text: string;
  time: string;
  voice?: boolean;
};

export type AgentStatus = "pending" | "running" | "done";

export type ExecutedRun = {
  id: string;
  crop: string;
  tonnes: number;
  mandi: string;
  price: number;
  net: number;
  at: string;
};

type Phase = "idle" | "running" | "awaiting" | "confirmed";

const now = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const emptyStatuses = () =>
  Object.fromEntries(AGENTS.map((a) => [a.key, "pending"])) as Record<AgentKey, AgentStatus>;

type AtlasState = {
  messages: ChatMessage[];
  phase: Phase;
  statuses: Record<AgentKey, AgentStatus>;
  activeAgent: AgentKey | null;
  plan: AtlasPlan | null;
  briefs: Partial<Record<AgentKey, string>>;
  briefEngine: AgentBriefs["engine"] | null;
  verdict: string;
  runs: ExecutedRun[];
  send: (
    text: string,
    voice?: boolean,
    opts?: { skipFarmerEcho?: boolean; decision?: FarmerDecision | undefined },
  ) => void;
  pushMessage: (from: "farmer" | "atlas", text: string, voice?: boolean) => void;

  approve: () => void;
  reset: () => void;
};

const translateGreeting = () => t("greeting");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAtlas = create<AtlasState>((set, get) => ({
  messages: [
    {
      id: "m0",
      from: "atlas",
      text: translateGreeting(),
      // No timestamp on the seed message: formatting it at module load
      // differs between SSR and hydration and breaks the React tree.
      time: "",
    },
  ],
  phase: "idle",
  statuses: emptyStatuses(),
  activeAgent: null,
  plan: null,
  briefs: {},
  briefEngine: null,
  verdict: "",
  runs: [],

  pushMessage: (from, text, voice = false) =>
    set((s) => ({
      messages: [...s.messages, { id: crypto.randomUUID(), from, text, time: now(), voice }],
    })),

  send: (text, voice = false, opts) => {

    if (get().phase === "running") return;
    const request = parseRequest(text, opts?.decision);
    const plan = buildPlan(request, opts?.decision);

    set((s) => ({
      messages: [
        ...s.messages,
        ...(opts?.skipFarmerEcho
          ? []
          : [{ id: crypto.randomUUID(), from: "farmer" as const, text, time: now(), voice }]),
        {
          id: crypto.randomUUID(),
          from: "atlas",
          text: t("gotIt", {
            tonnes: request.tonnes,
            crop: request.crop.toLowerCase(),
            village: request.village,
          }),
          time: now(),
        },
      ],
      phase: "running",
      statuses: emptyStatuses(),
      activeAgent: null,
      plan: null,
      briefs: {},
      briefEngine: null,
      verdict: "",
    }));

    // IBM watsonx (Granite) reviews the plan and issues a decision note per agent.
    void agentBriefs({
      data: {
        crop: plan.request.crop,
        tonnes: plan.request.tonnes,
        village: plan.request.village,
        priority: plan.priority,
        sellNow: plan.sellNow,
        mandi: plan.mandi.name,
        mandiPrice: plan.mandi.pricePerKg,
        mandiTrend: plan.mandi.trend,
        warehouse: plan.warehouse.name,
        storageDays: plan.storageDays,
        transporter: `${plan.transporter.name} (${plan.transporter.vehicle})`,
        etaMinutes: plan.transporter.etaMinutes,
        negotiatedPerKg: plan.economics.negotiatedPerKg,
        netRevenue: plan.economics.netRevenue,
        lang: useI18n.getState().lang,
      },
    })
      .then((res) => set({ briefs: res.notes, briefEngine: res.engine, verdict: res.verdict }))
      .catch((error) => console.error("watsonx agent review failed:", error));

    void (async () => {
      for (const agent of AGENTS) {
        set((s) => ({
          activeAgent: agent.key,
          statuses: { ...s.statuses, [agent.key]: "running" },
        }));
        await sleep(agent.durationMs);
        set((s) => ({
          statuses: { ...s.statuses, [agent.key]: "done" },
          plan,
        }));
      }

      set((s) => ({
        activeAgent: null,
        phase: "awaiting",
        plan,
        messages: [
          ...s.messages,
          {
            id: crypto.randomUUID(),
            from: "atlas",
            text: `${plan.summary}\n\n${t("shallProceed")}`,
            time: now(),
          },
        ],
      }));
    })();
  },

  approve: () => {
    const plan = get().plan;
    if (!plan) return;
    set((s) => ({
      phase: "confirmed",
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), from: "farmer", text: t("approved"), time: now(), voice: true },
        {
          id: crypto.randomUUID(),
          from: "atlas",
          text: `Done. Buyer confirmed at ₹${plan.economics.negotiatedPerKg}/kg, ${plan.warehouse.name} reserved, ${plan.transporter.name} arriving in ${plan.transporter.etaMinutes} minutes, insurance pack filed. Expected net ${inr(plan.economics.netRevenue)}. I'll message you at every step.`,
          time: now(),
        },
      ],
      runs: [
        {
          id: crypto.randomUUID(),
          crop: plan.request.crop,
          tonnes: plan.request.tonnes,
          mandi: plan.mandi.name,
          price: plan.economics.negotiatedPerKg,
          net: plan.economics.netRevenue,
          at: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        },
        ...s.runs,
      ],
    }));
  },

  reset: () =>
    set({
      phase: "idle",
      statuses: emptyStatuses(),
      activeAgent: null,
      plan: null,
      briefs: {},
      briefEngine: null,
      verdict: "",
      messages: [
        {
          id: crypto.randomUUID(),
          from: "atlas",
          text: t("readyNext"),
          time: now(),
        },
      ],
    }),
}));
