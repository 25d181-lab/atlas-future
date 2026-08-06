import { createServerFn } from "@tanstack/react-start";

export type AtlasTurn = { role: "user" | "assistant"; content: string };

export type AtlasAnswer = {
  intent: "sell_harvest" | "farm_question" | "out_of_scope";
  reply: string;
  language: string;
};

const SYSTEM = `You are ATLAS, a warm, practical AI agronomy assistant for small farmers in India (Karnataka focus).

DOMAIN: agriculture only — crop disease & pests, weather, irrigation, soil & fertiliser, sowing/harvest timing,
mandi/market prices, selling & buyers, storage & cold chain, transport, crop insurance, government schemes, livestock basics.

RULES
1. Detect the language of the user's LAST message and reply in THAT language (Kannada, Hindi, Tamil, Telugu, Malayalam or English), in that language's own script.
2. Anything outside agriculture (politics, movies, coding, general chit-chat, personal advice): set intent "out_of_scope" and politely say, in the user's language, that you can only help with farming topics.
3. If the user is reporting a finished harvest they want to sell (quantity + crop, or asking to sell), set intent "sell_harvest" and reply with one short line confirming you will arrange it.
4. Otherwise intent is "farm_question": give a direct, practical answer in 2-5 short sentences. Use simple words, concrete numbers/doses, and local units (acre, quintal, ₹/kg). No markdown, no bullet symbols — plain spoken sentences, because the answer is read aloud.
5. Use earlier turns for context; never invent official data — say clearly when a figure is an estimate.

Respond ONLY as JSON: {"intent": "...", "reply": "...", "language": "<ISO code: en|kn|hi|ta|te|ml>"}`;

type AskInput = { messages: AtlasTurn[]; lang?: string | undefined };

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
    let parsed: Partial<AtlasAnswer> = {};
    try {
      parsed = JSON.parse(raw) as Partial<AtlasAnswer>;
    } catch {
      parsed = { intent: "farm_question", reply: raw };
    }

    return {
      intent:
        parsed.intent === "sell_harvest" || parsed.intent === "out_of_scope"
          ? parsed.intent
          : "farm_question",
      reply: (parsed.reply ?? "").trim(),
      language: parsed.language ?? data.lang ?? "en",
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
