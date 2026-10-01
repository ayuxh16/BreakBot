import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  ListChecks,
  ShieldAlert,
  Settings,
  Search,
  Plus,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Domains", href: "/domains", icon: Globe },
  { label: "Test Runs", href: "/runs", icon: ListChecks },
  { label: "Findings", href: "/report/BB-1040", icon: ShieldAlert, badge: 25 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ title, crumb, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-ink text-slate-100 flex">
      <aside className="w-64 shrink-0 border-r border-line bg-panel flex flex-col">
        <div className="px-5 py-4 border-b border-line">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            breakbot<span className="text-accent">.</span>
          </Link>
        </div>

        <div className="px-5 py-4 border-b border-line flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold">
            A
          </div>
          <div className="text-sm">
            <div className="font-medium">Acme workspace</div>
            <div className="text-slate-400 text-xs">Free plan</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-2 text-xs uppercase tracking-wider text-slate-500 mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const active = location.pathname.startsWith(
              item.href.split("/").slice(0, 2).join("/")
            );
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-line space-y-3">
          <p className="px-2 text-xs uppercase tracking-wider text-slate-500">
            Quick actions
          </p>
          <Link
            to="/scan/new"
            className="flex items-center gap-2 justify-center bg-accent text-ink font-medium text-sm rounded-lg py-2 hover:opacity-90 transition"
          >
            <Plus size={16} />
            New scan
          </Link>
          <button className="w-full text-xs text-slate-400 hover:text-slate-200">
            Need help?
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-line flex items-center justify-between px-6 bg-panel/60">
          <div className="flex items-center gap-2 text-slate-400 bg-white/5 rounded-lg px-3 py-1.5 text-sm w-80">
            <Search size={14} />
            <span>Search anything...</span>
            <kbd className="ml-auto text-xs bg-white/10 rounded px-1.5 py-0.5">
              CtrlK
            </kbd>
          </div>
          <div className="h-8 w-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-sm font-semibold">
            JD
          </div>
        </header>

        <main className="flex-1 px-8 py-8 max-w-6xl w-full mx-auto">
          <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
            {crumb}
          </p>
          <h1 className="text-2xl font-semibold mb-6">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}