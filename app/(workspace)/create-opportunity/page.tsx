import { Lightbulb } from "lucide-react";
import { requireUser } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { OpportunityForm } from "@/components/forms/opportunity-form";
export const metadata = { title: "Create Opportunity" };
export default async function CreateOpportunity() {
  await requireUser();
  return <><PageHeading eyebrow="MAKE ROOM FOR A COLLABORATOR" title="Put your idea out there." description="Be clear about what you’re doing and who you’d love to do it with." /><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_250px]"><OpportunityForm /><aside className="rounded-xl border border-[#e5decf] bg-[#f8f5ed] p-6"><Lightbulb size={23} className="mb-4 text-[#ab9568]" /><h2 className="text-sm font-semibold">A good opportunity starts with…</h2><ul className="mt-4 list-disc space-y-3 pl-4 text-xs leading-6 text-[#8e826c]"><li>A clear, specific title.</li><li>A little context about the goal.</li><li>The skills you need, and what you bring.</li><li>A realistic time commitment.</li></ul><p className="mt-5 border-t border-[#e7e0d1] pt-4 text-[11px] leading-6 text-[#8e826c]">Your opportunity will be visible to signed-in students. Don’t share sensitive contact details.</p></aside></div></>;
}
