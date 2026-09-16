"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

import {
  createApiTokenAction,
  createWebhookSubscriptionAction,
  revokeApiTokenAction,
  revokeWebhookSubscriptionAction,
  setAiPreferenceAction,
} from "@/server/commands/p2-actions";

type WorkspaceIntegrationsPanelProps = {
  workspaceId: string;
  webhooks: Array<Record<string, unknown>>;
  tokens: Array<Record<string, unknown>>;
  aiEnabled: boolean;
};

export function WorkspaceIntegrationsPanel({
  workspaceId,
  webhooks,
  tokens,
  aiEnabled,
}: WorkspaceIntegrationsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Outgoing webhooks</h2>
        {webhooks.map((hook) => (
          <div key={String(hook.id)} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span className="truncate">{String(hook.url)}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await revokeWebhookSubscriptionAction({
                    workspaceId,
                    subscriptionId: String(hook.id),
                  });
                  if (!result.ok) toast.error(result.error);
                  else refresh();
                })
              }
            >
              Revoke
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhooks/orbit"
          />
          <Button
            disabled={pending || !webhookUrl.startsWith("https://")}
            onClick={() =>
              startTransition(async () => {
                const result = await createWebhookSubscriptionAction({
                  workspaceId,
                  url: webhookUrl.trim(),
                });
                if (!result.ok) toast.error(result.error);
                else {
                  setWebhookUrl("");
                  setRevealedSecret(result.secret ?? null);
                  toast.success("Webhook created");
                  refresh();
                }
              })
            }
          >
            Add
          </Button>
        </div>
        {revealedSecret ? (
          <p className="rounded-md border bg-muted/40 p-2 font-mono text-xs">
            Signing secret (copy now): {revealedSecret}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">API tokens</h2>
        {tokens.filter((token) => !token.revoked_at).map((token) => (
          <div key={String(token.id)} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>
              {String(token.name)} · {String(token.token_prefix)}…
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await revokeApiTokenAction({
                    workspaceId,
                    tokenId: String(token.id),
                  });
                  if (!result.ok) toast.error(result.error);
                  else refresh();
                })
              }
            >
              Revoke
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="Token name" />
          <Button
            disabled={pending || tokenName.trim().length < 2}
            onClick={() =>
              startTransition(async () => {
                const result = await createApiTokenAction({
                  workspaceId,
                  name: tokenName.trim(),
                });
                if (!result.ok) toast.error(result.error);
                else {
                  setTokenName("");
                  setRevealedToken(result.token ?? null);
                  toast.success("Token created");
                  refresh();
                }
              })
            }
          >
            Create
          </Button>
        </div>
        {revealedToken ? (
          <p className="rounded-md border bg-muted/40 p-2 font-mono text-xs">
            Token (copy now): {revealedToken}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">AI assistance (opt-in)</h2>
        <p className="text-sm text-muted-foreground">
          Enables local card summaries from content you can already read. No third-party provider is called.
        </p>
        <Button
          variant={aiEnabled ? "default" : "outline"}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await setAiPreferenceAction({
                workspaceId,
                enabled: !aiEnabled,
              });
              if (!result.ok) toast.error(result.error);
              else refresh();
            })
          }
        >
          {aiEnabled ? "Disable AI" : "Enable AI"}
        </Button>
      </section>
    </div>
  );
}
