import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { createClient } from "./supabase/server";
import { supabaseConfig } from "./supabase/config";
import { CATEGORIES, PAGE_SIZE, POST_COLUMNS, PROFILE_COLUMNS } from "./constants";
import { pageNumber, searchPattern, textArrayLiteral } from "./utils";
import type { Category, Opportunity, Post, Profile } from "@/types/database";

export type SearchParams = Record<string, string | string[] | undefined>;
export function param(params: SearchParams, key: string) {
  const value = params[key];
  return (typeof value === "string" ? value : "").trim().slice(0, 100);
}
export const getClient = cache(createClient);
export const requireUser = cache(async () => {
  if (!supabaseConfig()) redirect("/login");
  const supabase = await getClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});
export const getProfile = cache(async (id: string): Promise<Profile | null> => {
  await requireUser();
  if (!z.uuid().safeParse(id).success) return null;
  const supabase = await getClient();
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load profile.");
  return data;
});
export const currentProfile = cache(async () => {
  const { user } = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile) throw new Error("Profile is missing. Verify the database migration.");
  return profile;
});
export async function withAuthors(posts: Post[]): Promise<Opportunity[]> {
  if (!posts.length) return [];
  const supabase = await getClient();
  const ids = [...new Set(posts.map((post) => post.user_id))];
  const { data, error } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  if (error) throw new Error("Unable to load authors.");
  const authors = new Map(data.map((profile) => [profile.id, profile]));
  return posts.map((post) => ({ ...post, author: authors.get(post.user_id) ?? null }));
}
export async function getStudents(params: SearchParams) {
  const { supabase } = await requireUser();
  const page = pageNumber(param(params, "page"));
  let query = supabase.from("profiles").select(PROFILE_COLUMNS, { count: "exact" });
  const q = param(params, "q"), branch = param(params, "branch"), year = Number(param(params, "year"));
  if (q) query = query.ilike("search_text", searchPattern(q));
  if (branch) query = query.eq("branch", branch);
  if (Number.isInteger(year) && year >= 1 && year <= 6) query = query.eq("year", year);
  const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) throw new Error("Unable to find students.");
  return { students: data, count: count ?? 0, page };
}
export async function getOpportunities(params: SearchParams = {}, userId?: string, limit = PAGE_SIZE) {
  const { supabase } = await requireUser();
  const page = pageNumber(param(params, "page"));
  let query = supabase.from("posts").select(POST_COLUMNS, { count: "exact" });
  const q = param(params, "q"), category = param(params, "category"), skill = param(params, "skill");
  if (q) query = query.ilike("search_text", searchPattern(q));
  if (CATEGORIES.includes(category as Category)) query = query.eq("category", category as Category);
  if (skill) query = query.contains("skills_required", textArrayLiteral([skill]));
  if (userId) query = query.eq("user_id", userId);
  const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * limit, page * limit - 1);
  if (error) throw new Error("Unable to load opportunities.");
  return { opportunities: await withAuthors(data), count: count ?? 0, page };
}
export const getOpportunity = cache(async (id: string) => {
  const { supabase } = await requireUser();
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load opportunity.");
  if (!data) notFound();
  return (await withAuthors([data]))[0];
});
export async function dashboardData() {
  const { user, supabase } = await requireUser();
  const profile = await currentProfile();
  const [studentsCount, postsCount, mineCount, recent, peers] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getOpportunities({}, undefined, 4),
    supabase.from("profiles").select(PROFILE_COLUMNS).neq("id", user.id).order("created_at", { ascending: false }).limit(60),
  ]);
  if (studentsCount.error || postsCount.error || mineCount.error || peers.error) throw new Error("Unable to load dashboard.");
  const ownTags = new Set([...profile.skills, ...profile.interests].map((tag) => tag.toLowerCase()));
  const score = (p: Profile) => [...p.skills, ...p.interests].filter((tag) => ownTags.has(tag.toLowerCase())).length;
  const recommended = [...peers.data].sort((a, b) => score(b) - score(a)).slice(0, 3);
  return { profile, students: studentsCount.count ?? 0, opportunities: postsCount.count ?? 0, mine: mineCount.count ?? 0, recent: recent.opportunities, recommended };
}
