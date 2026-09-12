"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { BRANCHES, CATEGORIES, YEARS } from "@/lib/constants";
import { Button } from "./ui/button";

export function Filters({ type }: { type: "students" | "opportunities" }) {
  const params = useSearchParams();
  const router = useRouter(), path = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [first, setFirst] = useState(params.get(type === "students" ? "branch" : "category") ?? "");
  const [second, setSecond] = useState(params.get(type === "students" ? "year" : "skill") ?? "");
  const [error, setError] = useState("");
  function apply(event: React.FormEvent) {
    event.preventDefault();
    if (q.includes("*")) { setError("Use words or skill names rather than asterisks."); return; }
    setError("");
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (first) next.set(type === "students" ? "branch" : "category", first);
    if (second.trim()) next.set(type === "students" ? "year" : "skill", second.trim());
    startTransition(() => router.push(`${path}?${next}`, { scroll: false }));
  }
  function clear() {
    setQ(""); setFirst(""); setSecond(""); setError("");
    startTransition(() => router.push(path, { scroll: false }));
  }
  return <form onSubmit={apply} className="panel mb-6 p-4" role="search" aria-label={`Search ${type}`} aria-busy={pending}>
    <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(160px,1fr)_185px_150px_auto]">
      <div className="field"><label htmlFor="search" className="sr-only">Search {type}</label><div className="relative"><Search size={17} className="absolute top-3.5 left-3.5 text-[#a199ae]" /><input id="search" type="search" className="input !pl-10" value={q} onChange={(e) => setQ(e.target.value)} maxLength={100} placeholder={type === "students" ? "Search by name, skill, or interest…" : "Search titles, skills, or ideas…"} /></div></div>
      <div><label className="sr-only" htmlFor="filter-first">{type === "students" ? "Branch" : "Category"}</label><select id="filter-first" className="input" value={first} onChange={(e) => setFirst(e.target.value)}><option value="">{type === "students" ? "All branches" : "All categories"}</option>{(type === "students" ? BRANCHES : CATEGORIES).map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><label className="sr-only" htmlFor="filter-second">{type === "students" ? "Year" : "Required skill"}</label>{type === "students" ? <select id="filter-second" className="input" value={second} onChange={(e) => setSecond(e.target.value)}><option value="">All years</option>{YEARS.map((year) => <option key={year} value={year}>Year {year}</option>)}</select> : <input id="filter-second" className="input" value={second} onChange={(e) => setSecond(e.target.value)} maxLength={32} placeholder="Skill, e.g. React" />}</div>
      <Button type="submit" disabled={pending}>{pending ? <Loader2 size={15} className="animate-spin" /> : <SlidersHorizontal size={15} />}{pending ? "Searching…" : "Apply filters"}</Button>
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-muted">{type === "students" ? "Find a good fit, not just a familiar face." : "Skill filter matches the exact tag, including capitalization. Newest first."}</p>{(q || first || second) && <button type="button" onClick={clear} className="flex min-h-8 items-center gap-1 text-[11px] font-medium text-primary"><X size={12} />Clear filters</button>}</div>
    {error && <p role="alert" className="field-error mt-2">{error}</p>}
  </form>;
}
