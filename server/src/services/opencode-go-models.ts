import { createHash } from "node:crypto";
import type { AdapterModel } from "@paperclipai/adapter-utils";

const ENDPOINT = "https://opencode.ai/zen/go/v1/models";
const TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; models: AdapterModel[] }>();

export async function listOpenCodeGoModels(apiKey: string, refresh = false): Promise<AdapterModel[]> {
  const key = createHash("sha256").update(apiKey).digest("hex");
  const cached = cache.get(key);
  if (!refresh && cached && cached.expiresAt > Date.now()) return cached.models;
  const response = await fetch(ENDPOINT, {
    headers: { Authorization: `Bearer ${apiKey}` },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401 || response.status === 403) {
    await response.body?.cancel();
    throw new Error("OpenCode Go rejected this API key.");
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error("Could not load OpenCode Go models. Retry or enter a model ID manually.");
  }
  const payload = await response.json() as { data?: Array<{ id?: unknown; name?: unknown }> };
  if (!Array.isArray(payload.data)) throw new Error("OpenCode Go returned an invalid model catalog.");
  const models = payload.data.flatMap((model) => {
    if (typeof model.id !== "string" || !model.id.trim()) return [];
    const id = model.id.startsWith("opencode-go/") ? model.id : `opencode-go/${model.id}`;
    return [{ id, label: typeof model.name === "string" && model.name.trim() ? model.name : id }];
  }).filter((model, index, all) => all.findIndex((candidate) => candidate.id === model.id) === index)
    .sort((a, b) => a.label.localeCompare(b.label));
  cache.set(key, { expiresAt: Date.now() + TTL_MS, models });
  return models;
}
