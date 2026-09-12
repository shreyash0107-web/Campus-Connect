"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireUser } from "@/lib/data";
import { safeNext } from "@/lib/utils";
import { authMessage, loginSchema, opportunitySchema, profileSchema, readTags, signupSchema, type ActionState } from "@/lib/validation";

export async function authenticate(mode: "login" | "signup", _previous: ActionState, form: FormData): Promise<ActionState> {
  if (!supabaseConfig()) return { error: "Connect Supabase using the README before creating an account or signing in." };
  const values = Object.fromEntries(form);
  const parsed = (mode === "signup" ? signupSchema : loginSchema).safeParse(values);
  if (!parsed.success) return { fields: z.flattenError(parsed.error).fieldErrors, error: "Please check the highlighted fields." };
  let destination = safeNext(form.get("next"));
  try {
    const supabase = await createClient();
    if (mode === "signup") {
      const signup = signupSchema.parse(values);
      const origin = (await headers()).get("origin");
      const { data, error } = await supabase.auth.signUp({
        email: signup.email, password: signup.password,
        options: {
          data: { full_name: signup.full_name, branch: signup.branch, year: signup.year },
          ...(origin ? { emailRedirectTo: `${origin}/auth/callback?next=/profile?welcome=1` } : {}),
        },
      });
      if (error) return { error: authMessage(error.code) };
      if (!data.session) return { success: "Check your inbox to confirm your email. If this address already has an account, you can sign in instead." };
      destination = "/profile?welcome=1";
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
      if (error) return { error: authMessage(error.code) };
    }
  } catch { return { error: "We couldn’t reach the sign-in service. Check your connection and try again." }; }
  revalidatePath("/", "layout");
  redirect(destination);
}
export async function logout(): Promise<ActionState> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { error: "We couldn’t sign you out. Please try again." };
  } catch { return { error: "We couldn’t sign you out. Check your connection and try again." }; }
  revalidatePath("/", "layout");
  redirect("/login");
}
export async function saveProfile(_previous: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await requireUser();
  const parsed = profileSchema.safeParse({ ...Object.fromEntries(form), skills: readTags(form, "skills"), interests: readTags(form, "interests") });
  if (!parsed.success) return { fields: z.flattenError(parsed.error).fieldErrors, error: "Please check the highlighted fields." };
  try {
    const { data, error } = await supabase.from("profiles").update(parsed.data).eq("id", user.id).select("id").maybeSingle();
    if (error || !data) return { error: "Your profile couldn’t be saved. Please try again. If this continues, check the database setup." };
  } catch { return { error: "We couldn’t reach the server. Your changes have not been saved." }; }
  revalidatePath("/", "layout");
  return { success: "Your profile is up to date." };
}
export async function saveOpportunity(id: string | null, _previous: ActionState, form: FormData): Promise<ActionState> {
  const { user, supabase } = await requireUser();
  const parsed = opportunitySchema.safeParse({ ...Object.fromEntries(form), skills_required: readTags(form, "skills_required") });
  if (!parsed.success) return { fields: z.flattenError(parsed.error).fieldErrors, error: "Please check the highlighted fields." };
  if (id && !z.uuid().safeParse(id).success) return { error: "This opportunity is no longer available." };
  let savedId: string;
  try {
    const result = id
      ? await supabase.from("posts").update(parsed.data).eq("id", id).eq("user_id", user.id).select("id").maybeSingle()
      : await supabase.from("posts").insert({ ...parsed.data, user_id: user.id }).select("id").single();
    if (result.error || !result.data) return { error: "We couldn’t save this opportunity. Please try again; only the author can make changes." };
    savedId = result.data.id;
  } catch { return { error: "We couldn’t reach the server. Your opportunity has not been saved." }; }
  revalidatePath("/", "layout");
  redirect(`/opportunities/${savedId}?saved=${id ? "updated" : "created"}`);
}
export async function deleteOpportunity(id: string): Promise<ActionState> {
  const { user, supabase } = await requireUser();
  if (!z.uuid().safeParse(id).success) return { error: "This opportunity is no longer available." };
  try {
    const { data, error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
    if (error || !data) return { error: "We couldn’t delete this opportunity. It may have already been removed." };
  } catch { return { error: "We couldn’t reach the server. Please try again." }; }
  revalidatePath("/", "layout");
  return { success: "Opportunity deleted." };
}
