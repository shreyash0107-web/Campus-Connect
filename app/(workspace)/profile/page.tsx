import { ShieldCheck } from "lucide-react";
import { currentProfile, requireUser, param, type SearchParams } from "@/lib/data";
import { PageHeading } from "@/components/page-heading";
import { ProfileForm } from "@/components/forms/profile-form";
export const metadata = { title: "Your Profile" };
export default async function Profile({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await currentProfile(), { user } = await requireUser(), welcome = param(await searchParams, "welcome") === "1";
  return <div className="max-w-4xl"><PageHeading eyebrow={welcome ? "YOU’RE IN. LET’S MAKE AN INTRODUCTION." : "LET PEOPLE KNOW WHAT MAKES YOU, YOU"} title={welcome ? "Make yourself known." : "Your profile, your story."} description="Share a little about yourself. The right people will know where to find you." /><ProfileForm profile={profile} email={user.email ?? ""} welcome={welcome} /><p className="mt-5 flex items-start gap-2 text-[11px] leading-6 text-muted"><ShieldCheck size={15} className="mt-1 text-[#849675]" />Your profile is shared only with signed-in students. Your email is private. Only you can edit your details.</p></div>;
}
