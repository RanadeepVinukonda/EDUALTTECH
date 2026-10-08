import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config/env.js";

let admin: SupabaseClient | null = null;
let anon: SupabaseClient | null = null;

/** Service-role client — server-side only, never leaves the backend. */
export function supabaseAdmin(): SupabaseClient {
  admin ??= createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return admin;
}

export function supabaseAnon(): SupabaseClient {
  anon ??= createClient(config.supabase.url, config.supabase.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return anon;
}

export interface AuthUser {
  id: string;
  email: string;
}

/** Resolves a Supabase access token to its auth user, or null when invalid/expired. */
export async function getUserByToken(token: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email };
}
