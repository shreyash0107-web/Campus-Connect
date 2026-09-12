"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseConfig } from "./config";

export function createClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  return createBrowserClient<Database>(config.url, config.key);
}
