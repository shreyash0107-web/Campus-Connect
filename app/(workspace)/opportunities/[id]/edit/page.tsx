import { notFound } from "next/navigation";
import { getOpportunity, requireUser } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { OpportunityForm } from "@/components/forms/opportunity-form";
export const metadata = { title: "Edit Opportunity" };
export default async function EditOpportunity({ params }: { params: Promise<{ id: string }> }) {
  const post = await getOpportunity((await params).id), { user } = await requireUser();
  if (post.user_id !== user.id) notFound();
  return <div className="max-w-3xl"><PageHeading title="A little fine-tuning." description="Keep your opportunity clear, current, and ready for the right person." /><OpportunityForm post={post} /></div>;
}
