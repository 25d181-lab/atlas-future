import { createServerFn } from "@tanstack/react-start";
import { MANDIS, TRANSPORTERS, WAREHOUSES, WEATHER, FARMER } from "./atlas-data";

export type AtlasTurn = { role: "user" | "assistant"; content: string };

export type FarmerDecision = {
  crop?: string | undefined;
  quantityKg?: number | undefined;
  village?: string | undefined;
  priority?: "price" | "speed" | "storage" | "balanced" | undefined;
  targetMandi?: string | undefined;
  sellNow?: boolean | undefined;
};

export type AtlasAnswer = {
  intent: "sell_harvest" | "farm_question" | "out_of_scope";
  reply: string;
  language: string;
  decision?: FarmerDecision | undefined;
};

const liveContext = () => `LIVE PLATFORM DATA (simulated, but this is the ONLY market data you may quote — never invent other numbers):
Farmer: ${FARMER.name}, ${FARMER.village}, ${FARMER.landAcres} acres, crops ${FARMER.crops.join(", ")}.
Weather (${WEATHER.location}): ${WEATHER.forecast}, ${WEATHER.tempC}°C, humidity ${WEATHER.humidity}%, rain probability ${(WEATHER.rainProbability * 100).toFixed(0)}%.
Mandi prices today: ${MANDIS.map((m) => `${m.name} ₹${m.pricePerKg}/kg (72h trend ${m.trend > 0 ? "+" : ""}${m.trend}%, arrivals ${m.arrivalsTonnes}t, demand ${m.demandIndex}/100, ${m.distanceKm} km)`).join("; ")}.
Storage: ${WAREHOUSES.map((w) => `${w.name} ${w.type}, ${(w.capacityTonnes - w.usedTonnes).toFixed(0)}t free at ₹${w.ratePerTonneDay}/t/day, ${w.distanceKm} km`).join("; ")}.
Transport: ${TRANSPORTERS.map((t) => `${t.name} ${t.vehicle}, ${t.capacityTonnes}t, ETA ${t.etaMinutes} min, ₹${t.fare}`).join("; ")}.`;

const SYSTEM = `You are ATLAS, a warm, practical AI agronomy assistant for small farmers in India (Karnataka focus).

DOMAIN: agriculture only — crop disease & pests, weather, irrigation, soil & fertiliser, sowing/harvest timing,
mandi/market prices, selling & buyers, storage & cold chain, transport, crop insurance, government schemes, livestock basics.

RULES
1. Detect the language of the user's LAST message and reply in THAT language (Kannada, Hindi, Tamil, Telugu, Malayalam or English), in that language's own script.
2. Anything outside agriculture (politics, movies, coding, general chit-chat, personal advice): set intent "out_of_scope" and politely say, in the user's language, that you can only help with farming topics.
3. ANSWER THE ACTUAL QUESTION ASKED. Price questions get the specific mandi name, ₹/kg and trend from LIVE PLATFORM DATA. Disease questions get the likely disease name, the spray/dose and the timing. Weather questions get the forecast and what to do about it. Storage/transport questions get the named facility or vehicle with cost. Never give a generic answer when the live data can answer it.
4. If the user reports a harvest they want to sell / move / store (quantity + crop, or "sell my crop"), set intent "sell_harvest", reply with one short line confirming you will arrange it, and fill "decision" with what they actually asked for.
5. Otherwise intent is "farm_question": a direct, practical answer in 2-5 short sentences. Simple words, concrete numbers/doses, local units (acre, quintal, ₹/kg). No markdown, no bullet symbols — plain spoken sentences, because the answer is read aloud.
6. Use earlier turns for context; say clearly when a figure is an estimate.

"decision" (only for sell_harvest; omit unknown fields):
  crop: English crop name, e.g. "Tomato"
  quantityKg: number in kilograms
  village: pickup village if mentioned
  priority: "price" (best rate, willing to wait) | "speed" (sell/move today, cash now) | "storage" (hold and wait for better price) | "balanced"
  targetMandi: mandi name if the farmer named one
  sellNow: true if they want it sold/moved immediately with no cold hold

Respond ONLY as JSON: {"intent": "...", "reply": "...", "language": "<ISO code: en|kn|hi|ta|te|ml>", "decision": {...}}`;

type AskInput = { messages: AtlasTurn[]; lang?: string | undefined };

function normalizeDecision(value: unknown): FarmerDecision | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const priority =
    raw["priority"] === "price" || raw["priority"] === "speed" || raw["priority"] === "storage"
      ? (raw["priority"] as "price" | "speed" | "storage")
      : "balanced";
  const quantity = typeof raw["quantityKg"] === "number" && raw["quantityKg"] > 0 ? raw["quantityKg"] : undefined;
  const decision: FarmerDecision = {
    crop: typeof raw["crop"] === "string" && raw["crop"].trim() ? raw["crop"].trim() : undefined,
    quantityKg: quantity,
    village: typeof raw["village"] === "string" && raw["village"].trim() ? raw["village"].trim() : undefined,
    priority,
    targetMandi:
      typeof raw["targetMandi"] === "string" && raw["targetMandi"].trim() ? raw["targetMandi"].trim() : undefined,
    sellNow: raw["sellNow"] === true,
  };
  return decision;
}

export const askAtlas = createServerFn({ method: "POST" })
  .inputValidator((data: AskInput) => {
    if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
      throw new Error("No message to answer.");
    }
    const messages = data.messages
      .filter((m) => typeof m?.content === "string" && m.content.trim())
      .slice(-12)
      .map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content.slice(0, 2000),
      }));
    return { messages, lang: typeof data.lang === "string" ? data.lang : undefined };
  })
  .handler(async ({ data }): Promise<AtlasAnswer> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("The AI assistant is not configured.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: liveContext() },
          ...(data.lang
            ? [
                {
                  role: "system" as const,
                  content: `The farmer's app language is "${data.lang}". If the last message language is unclear, reply in "${data.lang}".`,
                },
              ]
            : []),
          ...data.messages,
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Assistant failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("Too many requests — try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error(`Assistant failed (${response.status}).`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<AtlasAnswer> & { decision?: unknown } = {};
    try {
      parsed = JSON.parse(raw) as Partial<AtlasAnswer>;
    } catch {
      parsed = { intent: "farm_question", reply: raw };
    }

    const intent =
      parsed.intent === "sell_harvest" || parsed.intent === "out_of_scope"
        ? parsed.intent
        : "farm_question";

    return {
      intent,
      reply: (parsed.reply ?? "").trim(),
      language: parsed.language ?? data.lang ?? "en",
      decision: intent === "sell_harvest" ? normalizeDecision(parsed.decision) : undefined,
    };
  });

type SpeakInput = { text: string };

export const speakAtlas = createServerFn({ method: "POST" })
  .inputValidator((data: SpeakInput) => {
    if (!data || typeof data.text !== "string" || !data.text.trim()) {
      throw new Error("Nothing to speak.");
    }
    return { text: data.text.trim().slice(0, 1200) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Voice playback is not configured.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: "alloy",
        response_format: "mp3",
        instructions: "Speak warmly and clearly, at a calm pace, like talking to a farmer on the phone.",
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Speech failed [${response.status}]: ${body}`);
      throw new Error(`Speech failed (${response.status}).`);
    }

    const buffer = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buffer.length; i += chunk) {
      binary += String.fromCharCode(...buffer.subarray(i, i + chunk));
    }
    return { audioBase64: btoa(binary) };
  });
