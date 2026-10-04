import { useState } from "react";
import type { EnvBinding } from "@paperclipai/shared";
import { storeProviderApiKey } from "@/lib/provider-credential";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function OpenCodeGoApiKeyField({
  companyId,
  configured,
  onSave,
}: {
  companyId: string;
  configured: boolean;
  onSave: (binding: EnvBinding) => Promise<void>;
}) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!apiKey.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const stored = await storeProviderApiKey(companyId, "OPENCODE_API_KEY", apiKey);
      await onSave(stored.binding);
      setApiKey("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the OpenCode Go key.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div>
        <p className="text-sm font-medium">OpenCode Go API key</p>
        <p className="text-xs text-muted-foreground">
          Saved as a secret and passed as <code>OPENCODE_API_KEY</code>. Set the model to <code>opencode-go/&lt;model&gt;</code>.
        </p>
      </div>
      {configured && <p className="text-xs text-muted-foreground">A key is configured. Enter a new key to replace it.</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="password"
          autoComplete="new-password"
          aria-label="OpenCode Go API key"
          placeholder="Paste OpenCode Go API key"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          disabled={saving}
        />
        <Button type="button" variant="outline" onClick={() => void save()} disabled={saving || !apiKey.trim()}>
          {saving ? "Saving…" : configured ? "Replace key" : "Save key"}
        </Button>
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
