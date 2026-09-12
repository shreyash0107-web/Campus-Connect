import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Code2, Compass, GraduationCap, Lightbulb, Plus, Search, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tags } from "@/components/cards";

const features = [
  { icon: Code2, title: "Find project partners", body: "An idea is a start. Find the people with the skills to bring it to life.", color: "bg-[#efeafa] text-[#7b61b6]" },
  { icon: Compass, title: "Discover skills", body: "From Figma to Python, explore what the people around you are building.", color: "bg-[#eaf1e6] text-[#678452]" },
  { icon: BookOpen, title: "Find study partners", body: "Make the difficult subjects a little easier. Find someone to learn alongside.", color: "bg-[#f9eddf] text-[#b38148]" },
  { icon: Users, title: "Build your network", body: "Go beyond your classroom. Meet students who share your curiosity.", color: "bg-[#e8eef9] text-[#6b87b6]" },
];
function ProductPreview() {
  return <div className="preview-board" aria-label="Illustrative product preview using sample student data">
    <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#9f8fc7]" /><span className="text-xs font-semibold text-[#726681]">Your campus, connected.</span></div><span className="rounded bg-white/70 px-2 py-1 text-[9px] tracking-wide text-[#857991]">SAMPLE PREVIEW</span></div>
    <div className="preview-card">
      <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#ede9f3] bg-[#faf9fc] px-3 py-2.5 text-[11px] text-[#9990a4]"><Search size={14} />Find your next project partner…</div>
      <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">People you should meet</span><Users size={14} className="text-[#b0a3c8]" /></div>
      <div className="grid grid-cols-2 gap-3">
        {[{ name: "Aanya Sharma", course: "Computer Science · Year 3", skills: ["React", "UI Design"] }, { name: "Arjun Mehta", course: "Electronics · Year 2", skills: ["Python", "Robotics"] }].map((student) => <div key={student.name} className="rounded-lg border border-[#eae6ef] p-3.5"><Avatar name={student.name} /><h3 className="mt-3 text-xs font-semibold tracking-normal">{student.name}</h3><p className="mt-1 mb-3 text-[9px] text-muted">{student.course}</p><Tags tags={student.skills} /></div>)}
      </div>
    </div>
    <div className="preview-card relative mt-3.5">
      <div className="flex items-center justify-between"><span className="badge badge-green">Project</span><span className="text-[10px] text-muted">Open to collaborate</span></div>
      <h3 className="mt-3 max-w-[270px] text-sm font-semibold leading-6 tracking-tight">Building something for the next campus hackathon?</h3>
      <div className="mt-3 flex items-center justify-between"><Tags tags={["React", "Figma"]} /><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eee9f8] text-primary"><ArrowUpRight size={16} /></span></div>
    </div>
    <div className="absolute -right-3 -bottom-5 flex items-center gap-2.5 rounded-xl border border-[#d8e4c1] bg-[#edf4df] px-4 py-3 shadow-sm sm:-right-5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#70834d]"><Lightbulb size={15} /></span><span className="text-[11px] font-medium text-[#52613b]">Big ideas start with a hello.</span></div>
  </div>;
}
export default function Home() {
  return <div className="landing">
    <header className="landing-wrap flex h-[88px] items-center justify-between gap-4">
      <Logo /><nav aria-label="Main navigation" className="hidden items-center gap-8 sm:flex"><a href="#features" className="text-xs text-muted hover:text-primary">Why CampusConnect</a><a href="#how-it-works" className="text-xs text-muted hover:text-primary">How it works</a></nav>
      <div className="flex items-center gap-2"><Link href="/login" className="btn btn-ghost hidden sm:inline-flex">Log in</Link><ButtonLink href="/signup">Get Started<ArrowUpRight size={15} /></ButtonLink></div>
    </header>
    <main id="main-content">
      <section className="landing-wrap landing-hero">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e3dfd1] bg-[#f2f1e9] px-3 py-1.5 text-[10px] font-semibold tracking-[.055em] text-[#777361]"><GraduationCap size={14} />MADE FOR YOUR NEXT CHAPTER</div>
          <h1 className="hero-title">Find the right<br />people to<br /><span className="serif text-[#7258ba]">build with.</span></h1>
          <p className="mt-6 max-w-[390px] text-[15px] leading-[1.9] text-[#807989]">Discover students with the skills and interests you need for your next project, study group, or campus collaboration.</p>
          <div className="mt-8 flex flex-wrap gap-3"><ButtonLink href="/signup">Get Started<ArrowRight size={16} /></ButtonLink><ButtonLink href="/students" variant="secondary">Explore Students<Users size={16} /></ButtonLink></div>
          <div className="mt-6 flex items-center gap-2 text-[11px] text-[#928995]"><Check size={13} className="text-[#768966]" />A little less searching. A lot more doing.</div>
        </div>
        <ProductPreview />
      </section>
      <section className="border-y border-[#eae6df] bg-[#f3f2ec]">
        <div className="landing-wrap flex flex-wrap items-center justify-between gap-5 py-6"><p className="text-xs font-medium text-[#8a837c]">GOOD THINGS HAPPEN TOGETHER.</p><div className="flex flex-wrap gap-x-9 gap-y-3 text-xs text-[#77716d]"><span className="flex items-center gap-2"><Code2 size={16} />Side projects</span><span className="flex items-center gap-2"><BookOpen size={16} />Study sessions</span><span className="flex items-center gap-2"><Lightbulb size={16} />Big ideas</span></div></div>
      </section>
      <section id="features" className="landing-wrap py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow mb-3">LESS NOISE. MORE CONNECTION.</p><h2 className="section-heading">Your people are already here.<br /><span className="serif text-[#837591]">You just haven’t met them yet.</span></h2></div><p className="max-w-[260px] text-xs leading-6 text-muted">Not another crowded group chat.<br />A little space for the things you want to do.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, body, color }) => <article key={title} className="rounded-xl border border-[#e8e4dc] bg-white/65 p-6"><div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} strokeWidth={1.5} /></div><h3 className="mb-3 text-sm font-semibold tracking-tight">{title}</h3><p className="text-xs leading-6 text-muted">{body}</p></article>)}</div>
      </section>
      <section id="how-it-works" className="landing-wrap pb-20">
        <div className="rounded-2xl border border-[#e6dfed] bg-[#f0edf5] px-6 py-12 sm:px-12"><div className="mb-10 text-center"><p className="eyebrow mb-3">FROM “WHAT IF” TO “LET’S DO IT”</p><h2 className="section-heading">A connection away from your next thing.</h2></div>
          <div className="grid gap-8 md:grid-cols-3">{[{ title: "Make yourself known", body: "Create your profile. Share your skills, interests, and what makes you, you." }, { title: "Find your kind of people", body: "Discover students by skills, branch, and year. Find a good fit, not just a familiar face." }, { title: "Start something together", body: "Find an opportunity or put your own idea out there. Your next team starts here." }].map((step, i) => <div key={step.title}><span className="mb-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d9d0e6] text-xs text-[#8a76aa]">0{i + 1}</span><h3 className="text-sm font-semibold tracking-tight">{step.title}</h3><p className="mt-2 text-xs leading-6 text-[#8a8096]">{step.body}</p></div>)}</div>
        </div>
      </section>
      <section className="landing-wrap pb-20 text-center"><span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee8f6] text-primary"><Plus size={21} /></span><h2 className="section-heading">Your next great idea deserves a team.</h2><p className="mt-3 text-sm text-muted">Start with a profile. See where it takes you.</p><ButtonLink href="/signup" className="mt-6">Find your people<ArrowRight size={16} /></ButtonLink></section>
    </main>
    <footer className="border-t border-[#e7e3dd]"><div className="landing-wrap flex flex-col items-center justify-between gap-4 py-7 sm:flex-row"><Logo /><p className="text-[11px] text-[#969099]">Built for campus. Made for connection.</p><div className="flex gap-5 text-xs text-muted"><Link href="/login">Log in</Link><Link href="/signup">Join CampusConnect</Link></div></div></footer>
  </div>;
}
