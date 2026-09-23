import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

// Server-side client with the service role key. Full API access — auth
// management (confirm/create users), storage, alerts. Never exposed to the client.
export const admin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// No-privilege client for credential signups/logins (password flows).
export const anon: SupabaseClient = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function getUserByToken(token: string): Promise<{ id: string; email: string; confirmedAt: Date | null } | null> {
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const confirmedAt =
    data.user.email_confirmed_at ?? data.user.confirmed_at ?? data.user.created_at;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    confirmedAt: confirmedAt ? new Date(confirmedAt) : null,
  };
}