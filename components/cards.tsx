import Link from "next/link";
import { ArrowUpRight, CalendarDays, GraduationCap } from "lucide-react";
import type { Category, Opportunity, Profile } from "@/types/database";
import { dateLabel } from "@/lib/utils";
import { Avatar } from "./ui/avatar";

export function CategoryBadge({ category }: { category: Category }) {
  const color = { Project: "", "Study Partner": "badge-blue", "Skill Sharing": "badge-green", Other: "badge-orange" }[category];
  return <span className={`badge ${color}`}>{category}</span>;
}
export function Tags({ tags, limit = 5 }: { tags: string[]; limit?: number }) {
  return <div className="flex flex-wrap gap-1.5">{tags.slice(0, limit).map((tag) => <span className="tag" key={tag}>{tag}</span>)}{tags.length > limit && <span className="tag">+{tags.length - limit}</span>}</div>;
}
export function StudentCard({ student }: { student: Profile }) {
  return <article className="panel student-card">
    <div className="flex items-center gap-3"><Avatar name={student.full_name} /><div className="min-w-0"><h3 className="card-title">{student.full_name}</h3><p className="mt-0.5 text-xs text-muted">Year {student.year} <span className="px-1">·</span> {student.branch}</p></div></div>
    <p className="description mt-4 line-clamp-2 min-h-[46px]">{student.bio || "A new face on campus. Explore their skills and opportunities."}</p>
    <div className="mt-4"><Tags tags={student.skills} /></div>
    {student.interests.length > 0 && <p className="mt-3 truncate text-[11px] text-muted">Into {student.interests.slice(0, 3).join(" · ")}</p>}
    <div className="mt-auto pt-5"><Link className="text-link w-full justify-between border-t border-[#eeecf3] pt-3" href={`/students/${student.id}`}>View Profile<ArrowUpRight size={16} /></Link></div>
  </article>;
}
export function OpportunityCard({ opportunity, children }: { opportunity: Opportunity; children?: React.ReactNode }) {
  return <article className="panel opportunity-card">
    <div className="mb-4 flex items-center justify-between gap-3"><CategoryBadge category={opportunity.category} /><span className="flex items-center gap-1.5 text-[10px] text-muted"><CalendarDays size={12} /><time dateTime={opportunity.created_at}>{dateLabel(opportunity.created_at)}</time></span></div>
    <h3 className="card-title"><Link href={`/opportunities/${opportunity.id}`} className="hover:text-primary">{opportunity.title}</Link></h3>
    <p className="description mt-2 mb-4 line-clamp-2">{opportunity.description}</p>
    <Tags tags={opportunity.skills_required} />
    <div className="mt-auto pt-5">
      <div className="flex items-center justify-between gap-2 border-t border-[#eeecf3] pt-4">
        <Link href={`/students/${opportunity.user_id}`} className="flex min-w-0 items-center gap-2.5"><Avatar name={opportunity.author?.full_name ?? "Student"} /><div className="min-w-0"><p className="truncate text-xs font-semibold">{opportunity.author?.full_name ?? "Student"}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted"><GraduationCap size={12} />{opportunity.author ? `Year ${opportunity.author.year}` : "Campus member"}</p></div></Link>
        <Link href={`/opportunities/${opportunity.id}`} aria-label={`View opportunity: ${opportunity.title}`} className="btn btn-ghost !px-3"><ArrowUpRight size={18} /></Link>
      </div>
      {children && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeecf3] pt-4">{children}</div>}
    </div>
  </article>;
}
