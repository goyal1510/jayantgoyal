import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"]);

function isPrivateIp(address) {
  if (!isIP(address)) return false;
  if (address === "127.0.0.1" || address === "::1") return true;
  if (address.startsWith("10.")) return true;
  if (address.startsWith("192.168.")) return true;
  if (address.startsWith("169.254.")) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(address)) return true;
  if (address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) {
    return true;
  }
  return false;
}

/** Reject webhook targets that resolve to private or local addresses. */
export async function assertSafeWebhookUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || isPrivateIp(hostname)) {
    throw new Error("Webhook URL host is not allowed");
  }

  const records = await lookup(hostname, { all: true });
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error("Webhook URL resolves to a private address");
    }
  }
}

export function signWebhookPayload(secret, payload) {
  const body = JSON.stringify(payload);
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  return { body, signature: `sha256=${digest}` };
}

export async function postWebhookDelivery({ url, signingSecret, eventType, payload, deliveryId }) {
  if (!signingSecret) {
    throw new Error("Missing signing secret; recreate the webhook subscription");
  }

  await assertSafeWebhookUrl(url);

  const envelope = {
    id: deliveryId,
    type: eventType,
    created_at: new Date().toISOString(),
    data: payload,
  };
  const { body, signature } = signWebhookPayload(signingSecret, envelope);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "Orbit-Webhooks/1.0",
      "x-orbit-event": eventType,
      "x-orbit-delivery": deliveryId,
      "x-orbit-signature": signature,
    },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }

  return response.status;
}
