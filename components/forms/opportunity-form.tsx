"use client";
import { useActionState, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { saveOpportunity } from "@/app/actions";
import type { Post } from "@/types/database";
import type { ActionState } from "@/lib/validation";
import { CATEGORIES } from "@/lib/constants";
import { Button, ButtonLink } from "../ui/button";
import { Field, fieldA11y } from "./field";
import { TagInput } from "./tag-input";
import { FormFeedback } from "./feedback";

export function OpportunityForm({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState(saveOpportunity.bind(null, post?.id ?? null), {} as ActionState);
  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [category, setCategory] = useState<string>(post?.category ?? "");
  const [skills, setSkills] = useState(post?.skills_required ?? []);
  return <form action={action} aria-busy={pending} className="panel space-y-6 p-6 sm:p-8">
    <Field name="title" label="Give your opportunity a clear title" hint={`${title.length}/120 characters. Be specific about what you’re looking for.`} error={state.fields?.title}><input {...fieldA11y("title", state.fields)} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Looking for a React developer for our campus app" minLength={8} maxLength={120} required /></Field>
    <Field name="category" label="Category" error={state.fields?.category}><select {...fieldA11y("category", state.fields)} className="input" value={category} onChange={(e) => setCategory(e.target.value)} required><option value="">What kind of collaboration?</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></Field>
    <Field name="description" label="Tell us about the opportunity" hint={`${description.length}/3,000 characters. Include the goal, who you need, and the expected time commitment.`} error={state.fields?.description}><textarea {...fieldA11y("description", state.fields)} className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you building or learning? What would a good teammate bring? Share enough detail to help someone decide if it’s a fit." rows={7} minLength={30} maxLength={3000} required /></Field>
    <TagInput name="skills_required" label="Skills required" value={skills} onChange={setSkills} error={state.fields?.skills_required} placeholder="e.g. React, Figma, DSA" />
    <FormFeedback state={state} />
    <div className="flex flex-wrap justify-between gap-3 border-t border-[#ede9f3] pt-5"><ButtonLink href={post ? `/opportunities/${post.id}` : "/opportunities"} variant="ghost">Cancel</ButtonLink><Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" size={16} /> : <ArrowUpRight size={16} />}{pending ? "Saving opportunity…" : post ? "Save changes" : "Publish Opportunity"}</Button></div>
  </form>;
}
