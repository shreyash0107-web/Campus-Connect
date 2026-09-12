import { Plus } from "lucide-react";
import { getOpportunities, param, type SearchParams } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { OpportunityCard } from "@/components/cards";
import { Filters } from "@/components/filters";
import { EmptyState } from "@/components/states";
import { Pagination } from "@/components/pagination";
import { ButtonLink } from "@/components/ui/button";
export const metadata = { title: "Opportunities" };
export default async function Opportunities({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams, invalid = param(params, "q").includes("*");
  const result = invalid ? { opportunities: [], count: 0, page: 1 } : await getOpportunities(params);
  const filtered = ["q", "category", "skill", "page"].some((key) => !!param(params, key));
  return <><PageHeading eyebrow="GOOD IDEAS NEED GOOD PEOPLE" title="Find your next thing." description="Projects to build. Subjects to master. Skills to share. Find where you fit."><ButtonLink href="/create-opportunity"><Plus size={16} />Create Opportunity</ButtonLink></PageHeading><Filters key={JSON.stringify(params)} type="opportunities" />{invalid && <p role="alert" className="mb-4 text-sm text-red-800">Use words or skill names rather than asterisks.</p>}<p className="mb-4 text-xs text-muted">{result.count} {result.count === 1 ? "opportunity" : "opportunities"} found <span className="px-2">·</span> Newest first</p>{result.opportunities.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{result.opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)}</div> : <EmptyState search={filtered} title={filtered ? "No opportunities match just yet." : "No opportunities yet."} description={filtered ? "Try a different keyword, category, or exact skill tag." : "Be the first to create one. Every great collaboration starts with an idea."} href={filtered ? "/opportunities" : "/create-opportunity"} action={filtered ? "Reset search" : "Create an opportunity"} />}<Pagination {...result} params={params} path="/opportunities" /></>;
}
