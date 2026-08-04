import { createServerFn } from "@tanstack/react-start";

type TranscribeInput = { audioBase64: string; language?: string | undefined };

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((data: TranscribeInput) => {
    if (!data || typeof data.audioBase64 !== "string" || data.audioBase64.length < 100) {
      throw new Error("Recording was empty — please try again.");
    }
    if (data.audioBase64.length > 12_000_000) {
      throw new Error("Recording is too long — keep it under a minute.");
    }
    const language = typeof data.language === "string" ? data.language : undefined;
    return { audioBase64: data.audioBase64, language } as {
      audioBase64: string;
      language?: string | undefined;
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Voice transcription is not configured.");

    const bytes = base64ToBytes(data.audioBase64);
    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append(
      "file",
      new Blob([bytes.buffer as ArrayBuffer], { type: "audio/wav" }),
      "recording.wav",
    );
    if (data.language) form.append("language", data.language);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Transcription failed [${response.status}]: ${body}`);
      if (response.status === 429) throw new Error("Too many requests — try again in a moment.");
      if (response.status === 402) throw new Error("AI credits exhausted for this workspace.");
      throw new Error(`Transcription failed (${response.status}).`);
    }

    const json = (await response.json()) as { text?: string };
    return { text: (json.text ?? "").trim() };
  });
