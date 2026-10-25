import "server-only";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function rateLimit(scope: string, max: number, windowSeconds: number) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const key = `${scope}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_key: key, p_max: max, p_window_seconds: windowSeconds,
  });
  if (error) return true; // fail open if the limiter is unavailable
  return data === true;
}

// one shared budget for everyone (used to protect the free AI quota)
export async function globalLimit(scope: string, max: number, windowSeconds: number) {
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_key: `global:${scope}`, p_max: max, p_window_seconds: windowSeconds,
  });
  if (error) return true;
  return data === true;
}
