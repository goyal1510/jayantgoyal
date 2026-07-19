/**
 * Compatibility handler for recovery links generated with the legacy
 * `/callback/auth/callback` template path. The canonical Auth callback is
 * `/callback`; keep this alias until previously issued links expire.
 */
export { GET } from "@/app/callback/route";
