import Link from "next/link";
import { Orbit } from "lucide-react";
export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return <Link href={href} className="inline-flex items-center gap-2.5 text-ink" aria-label="CampusConnect home">
    <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-white"><Orbit size={23} strokeWidth={1.7} /></span>
    {!compact && <span className="text-[18px] font-bold tracking-[-.045em]">Campus<span className="font-normal">Connect</span></span>}
  </Link>;
}
