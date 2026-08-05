import { create } from "zustand";
import { AGENTS, buildPlan, parseRequest, type AgentKey, type AtlasPlan } from "./atlas-agents";
import { inr } from "./atlas-data";
import { t } from "./i18n";

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
  runs: ExecutedRun[];
  send: (text: string, voice?: boolean) => void;
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
  runs: [],

  send: (text, voice = false) => {
    if (get().phase === "running") return;
    const request = parseRequest(text);
    const plan = buildPlan(request);

    set((s) => ({
      messages: [
        ...s.messages,
        { id: crypto.randomUUID(), from: "farmer", text, time: now(), voice },
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
    }));

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
