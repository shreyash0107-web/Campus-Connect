import { currentProfile } from "@/lib/data";
import { Navigation } from "@/components/navigation";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();
  return <><Navigation name={profile.full_name} branch={profile.branch} /><div className="workspace"><main id="main-content" className="workspace-content">{children}</main></div></>;
}
