import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Plus } from "lucide-react";

const stats = [
  { label: "Total domains", value: "3", sub: "2 verified domains" },
  { label: "Active scans", value: "1", sub: "1 scan in progress" },
  { label: "Critical findings", value: "2", sub: "Across all reports" },
  { label: "Avg. scan time", value: "8m 42s", sub: "Over the last 30 days" },
];

const runs = [
  { id: "BB-1042", domain: "shop.demo.dev", type: "Full scan", status: "Running", findings: "-", started: "Today, 09:42 AM", href: "/scan/BB-1042" },
  { id: "BB-1041", domain: "portfolio.ai", type: "Standard", status: "Completed", findings: "8", started: "Yesterday, 04:18 PM", href: "/report/BB-1041" },
  { id: "BB-1040", domain: "shop.demo.dev", type: "Full scan", status: "Completed", findings: "25", started: "Sep 22, 11:30 AM", href: "/report/BB-1040" },
  { id: "BB-1039", domain: "taskflow.app", type: "Standard", status: "Failed", findings: "-", started: "Sep 21, 02:15 PM", href: "/report/BB-1039" },
];

const severity = [
  { label: "Critical", value: 2, color: "bg-red-500" },
  { label: "High", value: 5, color: "bg-orange-500" },
  { label: "Medium", value: 11, color: "bg-yellow-500" },
  { label: "Low", value: 7, color: "bg-slate-500" },
];

const statusStyles = {
  Running: "bg-accent/10 text-accent",
  Completed: "bg-emerald-500/10 text-emerald-400",
  Failed: "bg-red-500/10 text-red-400",
};

export default function Dashboard() {
  const total = severity.reduce((a, s) => a + s.value, 0);

  return (
    <DashboardLayout crumb="BreakBot / Dashboard" title="Dashboard">
      <div className="flex items-center justify-between -mt-4 mb-8">
        <p className="text-slate-400 text-sm">
          An overview of your security testing activity.
        </p>
        <Link to="/scan/new" className="flex items-center gap-2 bg-accent text-ink font-medium text-sm rounded-lg px-4 py-2 hover:opacity-90 transition">
          <Plus size={16} />
          New scan
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="border border-line rounded-xl p-5 bg-panel/60">
            <p className="text-xs text-slate-500 mb-2">{s.label}</p>
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-line rounded-xl bg-panel/60">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <h2 className="font-medium">Recent test runs</h2>
              <p className="text-xs text-slate-500">Your latest application security scans</p>
            </div>
            <Link to="/runs" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-line">
                <th className="px-5 py-3 font-normal">Run ID</th>
                <th className="px-5 py-3 font-normal">Domain</th>
                <th className="px-5 py-3 font-normal">Type</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Findings</th>
                <th className="px-5 py-3 font-normal">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-white/5">
                  <td className="px-5 py-3">
                    <Link to={r.href} className="text-accent hover:underline">{r.id}</Link>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{r.domain}</td>
                  <td className="px-5 py-3 text-slate-400">{r.type}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{r.findings}</td>
                  <td className="px-5 py-3 text-slate-500">{r.started}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-line rounded-xl bg-panel/60 p-5">
          <h2 className="font-medium">Severity breakdown</h2>
          <p className="text-xs text-slate-500 mb-6">Findings by impact level</p>
          <p className="text-3xl font-semibold mb-1">{total}</p>
          <p className="text-xs text-slate-500 mb-5">Total findings</p>

          <div className="space-y-3">
            {severity.map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">{s.label}</span>
                  <span className="text-slate-400">{s.value}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${(s.value / total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}