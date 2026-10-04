import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

it("loads authenticated Go models, normalizes IDs, and caches by credential", async () => {
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: [
      { id: "kimi-k3", name: "Kimi K3" },
      { id: "opencode-go/glm-5" },
      { id: 42 },
    ] }),
  });
  vi.stubGlobal("fetch", fetch);
  const { listOpenCodeGoModels } = await import("./opencode-go-models.js");
  expect(await listOpenCodeGoModels("secret-token")).toEqual([
    { id: "opencode-go/kimi-k3", label: "Kimi K3" },
    { id: "opencode-go/glm-5", label: "opencode-go/glm-5" },
  ]);
  await listOpenCodeGoModels("secret-token");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith("https://opencode.ai/zen/go/v1/models", expect.objectContaining({
    headers: { Authorization: "Bearer secret-token" },
    redirect: "error",
    signal: expect.any(AbortSignal),
  }));
  await listOpenCodeGoModels("another-secret");
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("surfaces rejected OpenCode Go credentials without leaking the key", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 401, ok: false, body: { cancel: vi.fn() } }));
  const { listOpenCodeGoModels } = await import("./opencode-go-models.js");
  await expect(listOpenCodeGoModels("secret-token")).rejects.toThrow("OpenCode Go rejected this API key.");
});
