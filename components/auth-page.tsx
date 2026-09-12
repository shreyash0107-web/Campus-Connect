import { ArrowUpRight, Check, Sprout } from "lucide-react";
import { Logo } from "./logo";
import { AuthForm } from "./forms/auth-form";
import { SetupNotice } from "./states";
import { supabaseConfig } from "@/lib/supabase/config";
import { safeNext } from "@/lib/utils";

export function AuthPage({ mode, next, error }: { mode: "login" | "signup"; next?: string; error?: string }) {
  const signup = mode === "signup";
  const configured = !!supabaseConfig();
  return <div className="auth-grid">
    <aside className="auth-story"><Logo /><div className="py-16"><div className="mb-8 inline-flex rounded-2xl bg-[#e4ddf1] p-4 text-[#9175b4]"><Sprout size={35} strokeWidth={1.4} /></div><h2 className="max-w-sm text-[46px] leading-[1.15] font-semibold tracking-[-.05em]">Big things start<br />with the<br /><span className="serif text-[#8466b5]">right people.</span></h2><p className="mt-6 max-w-xs text-sm leading-7 text-[#8a7b9b]">Your next project partner might be one classroom away. Let’s help you find them.</p><div className="mt-10 space-y-3 text-xs text-[#7e6d92]">{["Skills that complement yours", "Ideas worth collaborating on", "Connections beyond the classroom"].map((text) => <div key={text} className="flex items-center gap-2"><Check size={14} />{text}</div>)}</div></div><p className="text-xs text-[#9a8ba9]">A little less searching. A lot more doing.<ArrowUpRight size={14} className="ml-2 inline" /></p></aside>
    <main id="main-content" className="auth-form-wrap"><div className="w-full max-w-[390px]"><div className="mb-9 md:hidden"><Logo /></div><p className="eyebrow mb-3">{signup ? "YOUR NEXT CHAPTER" : "YOUR CAMPUS WORKSPACE"}</p><h1 className="text-[32px] font-semibold tracking-[-.04em]">{signup ? "Find your people." : "Welcome back."}</h1><p className="mt-3 mb-7 text-sm text-muted">{signup ? "A few details today. A new collaboration tomorrow." : "Your next collaboration is waiting for you."}</p>
      {!configured && <div className="mb-6"><SetupNotice /></div>}
      {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-3 text-xs text-red-800">That confirmation link is invalid or has expired. Try signing in, or request a new confirmation email by signing up again.</p>}
      <AuthForm mode={mode} configured={configured} next={safeNext(next)} />
      <p className="mt-7 text-center text-[11px] leading-5 text-muted">Your profile is visible to signed-in students.<br />Your email and password stay private.</p>
    </div></main>
  </div>;
}
