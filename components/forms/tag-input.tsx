"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../ui/button";

export function TagInput({ name, label, value, onChange, error, placeholder }: {
  name: string; label: string; value: string[]; onChange: (tags: string[]) => void; error?: string[]; placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  function add() {
    const tag = draft.trim();
    if (!tag) return;
    if (tag.length > 32) { setNotice("Keep each tag under 33 characters."); return; }
    if (value.length >= 12) { setNotice("You can add up to 12 tags."); return; }
    if (value.some((existing) => existing.toLowerCase() === tag.toLowerCase())) { setNotice("You’ve already added that tag."); return; }
    onChange([...value, tag]); setDraft(""); setNotice("");
  }
  return <div className="field">
    <label className="label" htmlFor={name}>{label}</label><input type="hidden" name={name} value={JSON.stringify(value)} />
    {value.length > 0 && <ul className="mb-1 flex list-none flex-wrap gap-2 p-0">{value.map((tag) => <li className="tag !py-0 !pr-0 !pl-3" key={tag}>{tag}<button type="button" onClick={() => { onChange(value.filter((v) => v !== tag)); setNotice(""); }} aria-label={`Remove ${tag} from ${label}`} className="flex h-9 w-9 items-center justify-center rounded hover:bg-[#e7e0f4]"><X size={13} /></button></li>)}</ul>}
    <div className="flex gap-2"><input id={name} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} onBlur={add} className="input" placeholder={placeholder} maxLength={32} aria-describedby={`${name}-hint ${name}-error`} aria-invalid={!!error?.length} /><Button type="button" variant="secondary" onClick={add} aria-label={`Add ${label.toLowerCase()} tag`}><Plus size={15} />Add</Button></div>
    <p className="helper" id={`${name}-hint`}>Press Enter or Add for each tag. {value.length}/12 added.</p><p className="field-error" id={`${name}-error`} role="status">{notice || error?.[0]}</p>
  </div>;
}
