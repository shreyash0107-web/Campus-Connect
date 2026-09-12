"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { saveProfile } from "@/app/actions";
import type { Profile } from "@/types/database";
import type { ActionState } from "@/lib/validation";
import { BRANCHES, YEARS } from "@/lib/constants";
import { Avatar } from "../ui/avatar";
import { Button, ButtonLink } from "../ui/button";
import { Field, fieldA11y } from "./field";
import { TagInput } from "./tag-input";
import { FormFeedback } from "./feedback";

export function ProfileForm({ profile, email, welcome }: { profile: Profile; email: string; welcome: boolean }) {
  const [state, action, pending] = useActionState(saveProfile, {} as ActionState);
  const [values, setValues] = useState(profile);
  const update = (key: "full_name" | "branch" | "year" | "bio") => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setValues({ ...values, [key]: key === "year" ? Number(e.target.value) : e.target.value });
  return <form action={action} aria-busy={pending} className="panel overflow-hidden">
    <div className="flex items-center gap-5 border-b border-[#ede9f3] bg-[#fcfbfe] p-6 sm:p-8"><Avatar name={values.full_name} large /><div><h2 className="text-base font-semibold">Your campus identity</h2><p className="mt-2 text-xs leading-6 text-muted">Your initials update with your name.<br />No photo required. Just be yourself.</p></div></div>
    <div className="space-y-6 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2"><Field name="full_name" label="Full name" error={state.fields?.full_name}><input {...fieldA11y("full_name", state.fields)} className="input" value={values.full_name} onChange={update("full_name")} minLength={2} maxLength={80} required autoComplete="name" /></Field><Field name="email" label="Email address" hint="Only you can see this. Managed by your sign-in account."><input id="email" className="input !bg-[#f7f6fa]" value={email} readOnly aria-describedby="email-hint" /></Field></div>
      <div className="grid grid-cols-[1fr_115px] gap-5"><Field name="branch" label="Branch / course" error={state.fields?.branch}><select {...fieldA11y("branch", state.fields)} className="input" value={values.branch} onChange={update("branch")} required>{!BRANCHES.includes(values.branch) && <option>{values.branch}</option>}{BRANCHES.map((branch) => <option key={branch}>{branch}</option>)}</select></Field><Field name="year" label="Year of study" error={state.fields?.year}><select {...fieldA11y("year", state.fields)} className="input" value={values.year} onChange={update("year")} required>{YEARS.map((year) => <option key={year} value={year}>Year {year}</option>)}</select></Field></div>
      <Field name="bio" label="A little about you" hint={`${values.bio.length}/500 characters. What are you working on, learning, or curious about?`} error={state.fields?.bio}><textarea {...fieldA11y("bio", state.fields)} className="input" rows={4} value={values.bio} onChange={update("bio")} maxLength={500} placeholder="I’m a third-year student who loves building useful things for campus. Currently exploring web development and looking for a hackathon team." /></Field>
      <TagInput name="skills" label="Skills" value={values.skills} onChange={(skills) => setValues({ ...values, skills })} error={state.fields?.skills} placeholder="e.g. React, Python, UI Design" />
      <TagInput name="interests" label="Interests" value={values.interests} onChange={(interests) => setValues({ ...values, interests })} error={state.fields?.interests} placeholder="e.g. Hackathons, Robotics, Photography" />
      <FormFeedback state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ede9f3] pt-5"><ButtonLink href={welcome ? "/dashboard" : `/students/${profile.id}`} variant="ghost">{welcome ? "Go to dashboard" : "View my profile"}<ArrowRight size={15} /></ButtonLink><Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}{pending ? "Saving profile…" : "Save Profile"}</Button></div>
    </div>
  </form>;
}
