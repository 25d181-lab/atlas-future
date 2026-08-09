// IBM watsonx.ai (Granite) adapter.
// Used as the primary reasoning engine for the ATLAS assistant when
// WATSONX_API_KEY + WATSONX_PROJECT_ID are configured. Falls back gracefully.

type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

let cachedToken: { token: string; expiresAt: number } | null = null;

export function watsonxConfigured(): boolean {
  return Boolean(process.env["WATSONX_API_KEY"] && process.env["WATSONX_PROJECT_ID"]);
}

async function getIamToken(apiKey: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.token;

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });
  if (!res.ok) {
    throw new Error(`IBM IAM token failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return json.access_token;
}

/**
 * Chat completion through IBM watsonx.ai. Returns the raw assistant text.
 * Throws when watsonx is not configured or the call fails, so callers can fall back.
 */
export async function watsonxChat(messages: ChatTurn[], opts?: { json?: boolean }): Promise<string> {
  const apiKey = process.env["WATSONX_API_KEY"];
  const projectId = process.env["WATSONX_PROJECT_ID"];
  if (!apiKey || !projectId) throw new Error("watsonx not configured");

  const region = process.env["WATSONX_REGION"] ?? "us-south";
  const modelId = process.env["WATSONX_MODEL_ID"] ?? "ibm/granite-3-8b-instruct";
  const token = await getIamToken(apiKey);

  const res = await fetch(
    `https://${region}.ml.cloud.ibm.com/ml/v1/text/chat?version=2024-10-10`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model_id: modelId,
        project_id: projectId,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: 900,
        temperature: 0.2,
        ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`watsonx chat failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error("watsonx returned an empty response");
  return text;
}
