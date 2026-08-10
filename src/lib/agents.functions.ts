import { createServerFn } from "@tanstack/react-start";
import { watsonxChat, watsonxConfigured } from "./watsonx.server";

export type AgentBriefKey =
  | "agroguard"
  | "demand"
  | "negotiation"
  | "warehouse"
  | "logistics"
  | "insurance"
  | "twin";

export type AgentBriefs = {
  notes: Partial<Record<AgentBriefKey, string>>;
  verdict: string;
  engine: "watsonx" | "lovable";
};

export type AgentBriefInput = {
  crop: string;
  tonnes: number;
  village: string;
  priority: string;
  sellNow: boolean;
  mandi: string;
  mandiPrice: number;
  mandiTrend: number;
  warehouse: string;
  storageDays: number;
  transporter: string;
  etaMinutes: number;
  negotiatedPerKg: number;
  netRevenue: number;
  lang?: string | undefined;
};

const SYSTEM = `You are the IBM watsonx (Granite) reasoning layer coordinating ATLAS's seven agricultural agents for a small Indian farmer.

You receive the plan each agent produced. For EVERY agent, write ONE short decision note (max 28 words) that:
- states the decision watsonx endorses, adjusts or warns about, using the given numbers,
- is specific to that agent's job, never generic praise,
- is plain spoken language, no markdown.

Agents: agroguard (crop health), demand (market choice), negotiation (price), warehouse (cold storage), logistics (transport), insurance (claim readiness), twin (risk simulation).

Also give "verdict": one sentence (max 30 words) on whether the overall plan should proceed and the single biggest risk.

Reply in the farmer's language when a language code is given, otherwise English.

Respond ONLY as JSON:
{"notes":{"agroguard":"...","demand":"...","negotiation":"...","warehouse":"...","logistics":"...","insurance":"...","twin":"..."},"verdict":"..."}`;

const KEYS: AgentBriefKey[] = [
  "agroguard",
  "demand",
  "negotiation",
  "warehouse",
  "logistics",
  "insurance",
  "twin",
];

export const agentBriefs = createServerFn({ method: "POST" })
  .inputValidator((data: AgentBriefInput) => {
    if (!data || typeof data.crop !== "string") throw new Error("Invalid agent plan input.");
    return data;
  })
  .handler(async ({ data }): Promise<AgentBriefs> => {
    const context = `PLAN UNDER REVIEW
Lot: ${data.tonnes} t ${data.crop} from ${data.village}
Farmer priority: ${data.priority}${data.sellNow ? " (sell immediately, no cold hold)" : ""}
Market chosen: ${data.mandi} at ₹${data.mandiPrice}/kg, 72h trend ${data.mandiTrend > 0 ? "+" : ""}${data.mandiTrend}%
Negotiated price: ₹${data.negotiatedPerKg}/kg
Storage: ${data.warehouse} for ${data.storageDays} day(s)
Transport: ${data.transporter}, pickup in ${data.etaMinutes} min
Expected net: ₹${Math.round(data.netRevenue)}
${data.lang ? `Farmer language code: ${data.lang}` : ""}`;

    const messages = [
      { role: "system" as const, content: SYSTEM },
      { role: "user" as const, content: context },
    ];

    let raw: string | null = null;
    let engine: AgentBriefs["engine"] = "watsonx";

    if (watsonxConfigured()) {
      try {
        raw = await watsonxChat(messages, { json: true });
      } catch (error) {
        console.error("watsonx agent briefs failed, falling back:", error);
        raw = null;
      }
    }

    if (raw === null) {
      engine = "lovable";
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) throw new Error("Agent reasoning is not configured.");
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.6-flash",
          response_format: { type: "json_object" },
          messages,
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error(`Agent briefs failed [${response.status}]: ${body}`);
        throw new Error(`Agent reasoning failed (${response.status}).`);
      }
      const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      raw = json.choices?.[0]?.message?.content ?? "{}";
    }

    let parsed: { notes?: Record<string, unknown>; verdict?: unknown } = {};
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned) as typeof parsed;
    } catch {
      parsed = {};
    }

    const notes: Partial<Record<AgentBriefKey, string>> = {};
    for (const key of KEYS) {
      const value = parsed.notes?.[key];
      if (typeof value === "string" && value.trim()) notes[key] = value.trim();
    }

    return {
      notes,
      verdict: typeof parsed.verdict === "string" ? parsed.verdict.trim() : "",
      engine,
    };
  });
