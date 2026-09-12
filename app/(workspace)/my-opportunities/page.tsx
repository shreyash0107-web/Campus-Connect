import { Eye, Pencil, Plus } from "lucide-react";
import { getOpportunities, requireUser, type SearchParams } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { OpportunityCard } from "@/components/cards";
import { EmptyState } from "@/components/states";
import { ButtonLink } from "@/components/ui/button";
import { DeleteOpportunity } from "@/components/delete-opportunity";
import { Pagination } from "@/components/pagination";
export const metadata = { title: "My Opportunities" };
export default async function MyOpportunities({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { user } = await requireUser(), params = await searchParams;
  const result = await getOpportunities({ page: params.page }, user.id);
  return <><PageHeading eyebrow="IDEAS YOU’VE PUT INTO THE WORLD" title="Your opportunities." description={`${result.count} open ${result.count === 1 ? "opportunity" : "opportunities"}. Keep them fresh and find your next collaborator.`}><ButtonLink href="/create-opportunity"><Plus size={16} />Create Opportunity</ButtonLink></PageHeading>{result.opportunities.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{result.opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity}><ButtonLink href={`/opportunities/${opportunity.id}`} variant="ghost"><Eye size={14} />View</ButtonLink><ButtonLink href={`/opportunities/${opportunity.id}/edit`} variant="secondary"><Pencil size={14} />Edit</ButtonLink><DeleteOpportunity id={opportunity.id} /></OpportunityCard>)}</div> : <EmptyState title="Your next thing starts here." description="Create your first opportunity. Whether it’s a project or a study session, someone else might be looking for the same thing." href="/create-opportunity" action="Create an opportunity" />}<Pagination {...result} params={{ page: params.page }} path="/my-opportunities" /></>;
}
