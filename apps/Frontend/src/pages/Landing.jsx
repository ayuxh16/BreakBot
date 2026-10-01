import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Globe,
  Bug,
  FileWarning,
  Brain,
  Activity,
} from "lucide-react";

const features = [
  { n: "01", icon: ShieldCheck, title: "Domain ownership verification", body: "Only test applications you own. Establish trust before every scan begins." },
  { n: "02", icon: Globe, title: "Smart web crawler", body: "Map pages, routes, forms, and workflows with contextual discovery." },
  { n: "03", icon: Bug, title: "API fuzz testing", body: "Probe endpoints for weak validation and unexpected behavior." },
  { n: "04", icon: FileWarning, title: "Security header audit", body: "Catch missing protections and risky configuration at a glance." },
  { n: "05", icon: Brain, title: "AI business logic agent", body: "Explore the workflows that traditional scanners often overlook." },
  { n: "06", icon: Activity, title: "Live findings dashboard", body: "Follow every test in real time and share reproducible evidence." },
];

const steps = [
  { n: "01", title: "Add your domain", body: "Register the application you want to test." },
  { n: "02", title: "Verify ownership", body: "Prove you control the domain before testing." },
  { n: "03", title: "Configure a scan", body: "Choose depth, AI analysis, and safe mode." },
  { n: "04", title: "Watch it work", body: "Follow discovery and checks as they happen." },
  { n: "05", title: "Review findings", body: "Get clear evidence and next steps." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          breakbot<span className="text-accent">.</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#features" className="hover:text-white">Platform</a>
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <Link to="/dashboard" className="hover:text-white">View demo</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/login" className="text-slate-300 hover:text-white">Log in</Link>
          <Link to="/login" className="bg-accent text-ink font-medium rounded-lg px-4 py-2 hover:opacity-90 transition">
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto text-center px-6 pt-20 pb-28">
        <p className="text-accent text-xs tracking-[0.2em] uppercase mb-6">
          The new standard in web app testing
        </p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight">
          Break what attackers would.
          <br />
          Before users do.
        </h1>
        <p className="mt-6 text-slate-400 text-lg max-w-2xl mx-auto">
          Workflow-aware web application security and quality testing with
          AI-powered business logic analysis.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link to="/login" className="bg-accent text-ink font-medium rounded-lg px-6 py-3 hover:opacity-90 transition">
            Start free scan
          </Link>
          <Link to="/dashboard" className="border border-line rounded-lg px-6 py-3 text-slate-200 hover:bg-white/5 transition">
            View demo
          </Link>
        </div>
        <p className="mt-16 text-xs uppercase tracking-widest text-slate-600">
          Built for the teams that ship the web
        </p>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-accent text-xs tracking-[0.2em] uppercase mb-3">
          The platform / 01
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold max-w-2xl">
          Everything you need to test with confidence.
        </h2>
        <p className="mt-4 text-slate-400 max-w-xl">
          Go beyond surface-level checks. Understand how your application
          actually works and where it breaks.
        </p>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ n, icon: Icon, title, body }) => (
            <div key={n} className="border border-line rounded-2xl p-6 bg-panel/60 hover:border-accent/40 transition">
              <div className="flex items-center justify-between mb-4">
                <Icon className="text-accent" size={22} />
                <span className="text-xs text-slate-600">{n} / 06</span>
              </div>
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-accent text-xs tracking-[0.2em] uppercase mb-3">
          The process / 02
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold max-w-2xl">
          From URL to clarity in five steps.
        </h2>
        <p className="mt-4 text-slate-400 max-w-xl">
          A simple, deliberate workflow that puts ownership and actionable
          evidence first.
        </p>

        <div className="mt-14 grid md:grid-cols-5 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="border-t-2 border-accent pt-4">
              <span className="text-xs text-slate-600">{s.n}</span>
              <h3 className="font-medium mt-2 mb-1">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto text-center px-6 py-24">
        <p className="text-accent text-xs tracking-[0.2em] uppercase mb-4">
          Ready when you are
        </p>
        <h2 className="text-3xl md:text-4xl font-semibold">
          Ship with fewer surprises.
        </h2>
        <p className="mt-4 text-slate-400">
          Know what breaks before anyone else finds out.
        </p>
        <Link to="/login" className="mt-8 inline-block bg-accent text-ink font-medium rounded-lg px-6 py-3 hover:opacity-90 transition">
          Start free scan
        </Link>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-slate-500">
          <span>breakbot. (c) 2026 BreakBot. Test responsibly.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300">GitHub</a>
            <a href="#" className="hover:text-slate-300">Docs</a>
            <a href="#" className="hover:text-slate-300">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}