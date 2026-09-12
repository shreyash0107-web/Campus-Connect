"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { authenticate } from "@/app/actions";
import { BRANCHES, YEARS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Field, fieldA11y } from "./field";
import type { ActionState } from "@/lib/validation";

export function AuthForm({ mode, configured, next }: { mode: "login" | "signup"; configured: boolean; next: string }) {
  const [state, action, pending] = useActionState(authenticate.bind(null, mode), {} as ActionState);
  const [visible, setVisible] = useState(false);
  const [values, setValues] = useState({ full_name: "", email: "", password: "", branch: "", year: "" });
  const signup = mode === "signup";
  const update = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues({ ...values, [key]: event.target.value });
  if (state.success) return <div className="rounded-xl border border-[#dbe9dc] bg-[#f2f8f1] p-6" role="status"><MailCheck size={30} className="mb-4 text-[#638854]" /><h2 className="text-xl font-semibold">One more step.</h2><p className="mt-3 text-sm text-muted">{state.success}</p><Link href="/login" className="text-link mt-5">Back to login<ArrowRight size={15} /></Link></div>;
  return <form action={action} className="space-y-4" aria-busy={pending}>
    <input type="hidden" name="next" value={next} />
    {signup && <Field name="full_name" label="Full name" error={state.fields?.full_name}><input {...fieldA11y("full_name", state.fields)} className="input" value={values.full_name} onChange={update("full_name")} placeholder="Your name" autoComplete="name" required minLength={2} maxLength={80} /></Field>}
    <Field name="email" label="Email address" error={state.fields?.email}><input {...fieldA11y("email", state.fields)} className="input" type="email" value={values.email} onChange={update("email")} placeholder="you@university.edu" autoComplete="email" required maxLength={254} /></Field>
    <Field name="password" label="Password" hint={signup ? "At least 8 characters. Make it something only you know." : undefined} error={state.fields?.password}>
      <div className="relative"><input {...fieldA11y("password", state.fields)} className="input pr-12" type={visible ? "text" : "password"} value={values.password} onChange={update("password")} placeholder={signup ? "Create a password" : "Enter your password"} autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={128} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="absolute top-0 right-0 flex h-[45px] w-11 items-center justify-center text-muted">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
    </Field>
    {signup && <div className="grid grid-cols-[1fr_110px] gap-4">
      <Field name="branch" label="Branch / course" error={state.fields?.branch}><select {...fieldA11y("branch", state.fields)} className="input" value={values.branch} onChange={update("branch")} required><option value="">Select branch</option>{BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}</select></Field>
      <Field name="year" label="Year of study" error={state.fields?.year}><select {...fieldA11y("year", state.fields)} className="input" value={values.year} onChange={update("year")} required><option value="">Select</option>{YEARS.map((year) => <option key={year} value={year}>Year {year}</option>)}</select></Field>
    </div>}
    {state.error && <p role="alert" className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-6 text-red-800">{state.error}</p>}
    <Button type="submit" className="mt-2 w-full" disabled={!configured || pending}>{pending ? <><Loader2 size={16} className="animate-spin" />{signup ? "Creating your account…" : "Signing in…"}</> : <>{signup ? "Create your account" : "Log in"}<ArrowRight size={16} /></>}</Button>
    <p className="pt-1 text-center text-xs text-muted">{signup ? "Already found us?" : "New around here?"} <Link className="font-semibold text-primary" href={`${signup ? "/login" : "/signup"}?next=${encodeURIComponent(next)}`}>{signup ? "Log in" : "Create an account"}</Link></p>
  </form>;
}
