import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown, CalendarDays, GraduationCap, Pencil } from "lucide-react";
import { getProfile, getOpportunities, requireUser, type SearchParams } from "@/lib/data";
import { dateLabel } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { OpportunityCard, Tags } from "@/components/cards";
import { EmptyState } from "@/components/states";
import { Pagination } from "@/components/pagination";
export const metadata = { title: "Student Profile" };
export default async function Student({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const { id } = await params;
  const { user } = await requireUser();
  const profile = await getProfile(id);
  if (!profile) notFound();
  const query = await searchParams, result = await getOpportunities(query, id), own = user.id === id;
  return <><Link href="/students" className="text-link mb-6"><ArrowLeft size={14} />Discover Students</Link><section className="panel mb-8 overflow-hidden"><div className="h-20 border-b border-[#e5dfee] bg-[#f0ebf7]" /><div className="p-6 pt-0 sm:p-8 sm:pt-0"><div className="relative -mt-10 mb-5 flex flex-wrap items-end justify-between gap-4"><div className="rounded-[25px] border-4 border-white"><Avatar name={profile.full_name} large /></div>{own ? <ButtonLink href="/profile" variant="secondary"><Pencil size={14} />Edit Profile</ButtonLink> : <a href="#student-opportunities" className="btn btn-secondary">View Opportunities<ArrowDown size={14} /></a>}</div><h1 className="text-3xl font-semibold">{profile.full_name}</h1><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted"><span className="flex items-center gap-1.5"><GraduationCap size={15} />{profile.branch} · Year {profile.year}</span><span className="flex items-center gap-1.5"><CalendarDays size={14} />Joined {dateLabel(profile.created_at)}</span></div><p className="mt-6 max-w-2xl text-sm leading-7 whitespace-pre-wrap break-words text-muted">{profile.bio || "This student hasn’t added a bio yet. Their next collaboration could be a good place to start."}</p><div className="mt-7 grid gap-6 sm:grid-cols-2"><div><h2 className="mb-3 text-xs font-semibold tracking-normal">Skills</h2>{profile.skills.length ? <Tags tags={profile.skills} limit={12} /> : <p className="text-xs text-muted">Still adding their skills.</p>}</div><div><h2 className="mb-3 text-xs font-semibold tracking-normal">Interests</h2>{profile.interests.length ? <Tags tags={profile.interests} limit={12} /> : <p className="text-xs text-muted">A little mystery for now.</p>}</div></div></div></section><section id="student-opportunities" className="scroll-mt-24"><h2 className="mb-5 text-lg font-semibold">{own ? "Your opportunities" : `Opportunities by ${profile.full_name.split(" ")[0]}`} <span className="ml-1 text-sm font-normal text-muted">({result.count})</span></h2>{result.opportunities.length ? <div className="grid gap-5 lg:grid-cols-2">{result.opportunities.map((post) => <OpportunityCard key={post.id} opportunity={post} />)}</div> : <EmptyState title="No opportunities yet." description={own ? "Have something in mind? Make room for a collaborator." : "This student hasn’t shared an opportunity yet. Explore other ideas on campus."} href={own ? "/create-opportunity" : "/opportunities"} action={own ? "Create an opportunity" : "Explore opportunities"} />}<Pagination {...result} params={query} path={`/students/${id}`} /></section></>;
}
