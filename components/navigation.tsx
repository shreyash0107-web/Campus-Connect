"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Compass, LayoutDashboard, LogOut, Menu, NotebookPen, Plus, Sprout, UserRound, Users, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { logout } from "@/app/actions";
import { Logo } from "./logo";
import { Avatar } from "./ui/avatar";
import { Button, ButtonLink } from "./ui/button";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Discover Students", icon: Users },
  { href: "/opportunities", label: "Opportunities", icon: Compass },
  { href: "/my-opportunities", label: "My Opportunities", icon: NotebookPen },
  { href: "/profile", label: "Profile", icon: UserRound },
];
export function Navigation({ name, branch }: { name: string; branch: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = items.find((item) => path.startsWith(item.href))?.label ?? "Create Opportunity";
  function signOut() {
    startTransition(async () => {
      try { const result = await logout(); if (result.error) toast.error(result.error); }
      catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        toast.error("We couldn’t sign you out. Please try again.");
      }
    });
  }
  const links = <nav aria-label="Workspace navigation" className="mt-7"><p className="eyebrow mb-3 px-3 !text-[9px] !text-[#a49aa9]">YOUR WORKSPACE</p>{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="nav-item" data-active={path.startsWith(href)} aria-current={path.startsWith(href) ? "page" : undefined} onClick={() => setOpen(false)}><Icon size={18} strokeWidth={1.6} />{label}</Link>)}</nav>;
  const bottom = <div className="mt-auto pt-8">
    <div className="mb-5 rounded-xl border border-[#e8e5d9] bg-[#f6f5ee] p-4"><Sprout className="mb-2 text-[#92966d]" size={22} strokeWidth={1.5} /><p className="text-xs font-semibold text-[#747351]">Something in mind?</p><p className="mt-1 text-[11px] leading-5 text-[#999681]">Put your idea out there.<br />Find someone to build it with.</p><Link href="/create-opportunity" onClick={() => setOpen(false)} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#7b7c53]">Create an opportunity<Plus size={13} /></Link></div>
    <div className="flex items-center gap-2.5 border-t border-[#efecf2] pt-5"><Avatar name={name} /><div className="min-w-0"><p className="truncate text-xs font-semibold">{name}</p><p className="truncate text-[10px] text-muted">{branch}</p></div></div>
    <Button onClick={signOut} disabled={pending} variant="ghost" className="mt-3 w-full !justify-start !px-2 !text-xs">{pending ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}Log out</Button>
  </div>;
  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[242px] flex-col overflow-y-auto border-r border-[#e9e7ef] bg-white px-5 py-7 md:flex max-[1100px]:w-[218px]"><Logo href="/dashboard" />{links}{bottom}</aside>
    <header className="sticky top-0 z-30 flex h-[73px] items-center justify-between gap-3 border-b border-[#e9e7ef] bg-white/95 px-5 backdrop-blur-sm md:ml-[242px] md:px-10 min-[768px]:max-[1100px]:ml-[218px]">
      <div className="flex items-center gap-3">
        <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button variant="ghost" className="!px-2 md:hidden" aria-label="Open navigation"><Menu size={21} /></Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="mobile-drawer flex flex-col"><Dialog.Title className="sr-only">CampusConnect navigation</Dialog.Title><Dialog.Description className="sr-only">Navigate your campus workspace.</Dialog.Description><div className="flex items-center justify-between"><Logo href="/dashboard" /><Dialog.Close asChild><Button variant="ghost" className="!px-2" aria-label="Close navigation"><X size={20} /></Button></Dialog.Close></div>{links}{bottom}</Dialog.Content></Dialog.Portal></Dialog.Root>
        <span className="text-xs font-medium text-[#716879]">{active}</span><span className="hidden text-[#d5cddd] sm:inline">/</span><span className="hidden text-[11px] text-[#a299a8] sm:inline">Your campus, connected</span>
      </div>
      <div className="flex items-center gap-4"><ButtonLink href="/create-opportunity" variant="secondary" className="hidden !min-h-9 !py-1.5 !text-[11px] sm:inline-flex"><Plus size={14} />Create Opportunity</ButtonLink><Link href="/profile" aria-label="Your profile"><Avatar name={name} /></Link></div>
    </header>
  </>;
}
