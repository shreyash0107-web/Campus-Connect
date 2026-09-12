"use client";
import { RefreshCw, CloudOff } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div id="main-content" className="panel mx-auto my-12 flex max-w-xl flex-col items-center px-6 py-14 text-center"><div className="mb-5 rounded-2xl bg-[#f0ebf8] p-4 text-primary"><CloudOff size={27} /></div><h1 className="text-2xl font-semibold">We couldn’t load this right now.</h1><p className="mt-3 max-w-sm text-sm leading-7 text-muted">Please check your connection and try again. If this is a new installation, make sure the Supabase migration has been applied.</p><div className="mt-7 flex gap-3"><Button onClick={reset}><RefreshCw size={16} />Try again</Button><ButtonLink href="/" variant="secondary">Back home</ButtonLink></div></div>;
}
