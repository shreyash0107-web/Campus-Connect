import { ArrowRight, Compass, Database, SearchX } from "lucide-react";
import { ButtonLink } from "./ui/button";

export function EmptyState({ title, description, href, action, search = false }: {
  title: string; description: string; href?: string; action?: string; search?: boolean;
}) {
  const Icon = search ? SearchX : Compass;
  return <div className="panel flex flex-col items-center px-6 py-16 text-center">
    <div className="mb-5 rounded-2xl bg-[#f1edf9] p-4 text-primary"><Icon size={26} strokeWidth={1.5} /></div>
    <h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
    {href && action && <ButtonLink href={href} variant="secondary" className="mt-6">{action}<ArrowRight size={15} /></ButtonLink>}
  </div>;
}
export function SetupNotice() {
  return <section className="rounded-xl border border-[#e4d9b9] bg-[#fffbef] p-4" aria-label="Supabase setup required">
    <div className="flex items-center gap-2 font-semibold text-[#776027]"><Database size={17} />Connect Supabase to get started</div>
    <p className="mt-2 text-xs leading-6 text-[#7a6842]">Authentication and persistent data aren’t connected yet. Add your Supabase URL and public anon key to <code>.env.local</code>, run the included SQL migration, and restart the app. Follow the README for exact steps.</p>
    <p className="mt-2 text-xs font-semibold text-[#7a6842]">No accounts or data are simulated.</p>
  </section>;
}
export function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return <div role="status" aria-label="Loading content">
    <span className="sr-only">Finding your campus connections…</span>
    <div className="mb-8 space-y-3"><div className="skeleton h-8 w-56" /><div className="skeleton h-4 w-72 max-w-full" /></div>
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: count }, (_, i) =>
      <div className="panel space-y-5 p-6" key={i}><div className="flex gap-3"><div className="skeleton h-11 w-11" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div></div><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-4/5" /><div className="skeleton h-7 w-2/3" /></div>
    )}</div>
  </div>;
}
