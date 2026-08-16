import { createHmac } from "node:crypto";

const MINIMUM_SECRET_LENGTH = 32;

export function createContactRateLimitKey(ip: string, secret: string): string {
  if (secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `CONTACT_RATE_LIMIT_SECRET must be at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }

  return createHmac("sha256", secret)
    .update(ip.trim().toLowerCase())
    .digest("hex");
}
