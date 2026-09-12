import { z } from "zod";
import { CATEGORIES } from "./constants";

const tags = z.array(z.string().trim().min(1).max(32, "Keep each tag under 33 characters.")).max(12, "Use up to 12 tags.");
export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter at least 2 characters.").max(80),
  branch: z.string().trim().min(2, "Choose your branch or course.").max(100),
  year: z.coerce.number().int().min(1).max(6),
  bio: z.string().trim().max(500, "Keep your bio under 501 characters."),
  skills: tags,
  interests: tags,
});
export const signupSchema = profileSchema.pick({ full_name: true, branch: true, year: true }).extend({
  email: z.email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128),
});
export const loginSchema = signupSchema.pick({ email: true }).extend({
  password: z.string().min(1, "Enter your password.").max(128),
});
export const opportunitySchema = z.object({
  title: z.string().trim().min(8, "Use at least 8 characters so your title is clear.").max(120),
  description: z.string().trim().min(30, "Add at least 30 characters about what you want to do.").max(3000),
  category: z.enum(CATEGORIES, { error: "Choose a category." }),
  skills_required: tags,
});
export type ActionState = { error?: string; fields?: Record<string, string[]>; success?: string };
export function readTags(form: FormData, key: string) {
  try {
    const value: unknown = JSON.parse(String(form.get(key) || "[]"));
    return Array.isArray(value) ? value : null;
  } catch { return null; }
}
export function authMessage(code?: string) {
  if (code === "invalid_credentials") return "That email and password don’t match. Please try again.";
  if (code === "email_not_confirmed") return "Please confirm your email before signing in. Check your inbox and spam folder.";
  if (code === "user_already_exists" || code === "email_exists") return "An account may already use this email. Try signing in.";
  if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") return "Too many attempts. Please wait a few minutes and try again.";
  if (code === "weak_password") return "Choose a stronger password with a mix of letters, numbers, and symbols.";
  return "We couldn’t complete that request. Please try again shortly.";
}
