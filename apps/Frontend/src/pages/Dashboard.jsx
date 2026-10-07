import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Plus } from "lucide-react";

const statusStyles = {
  running: "bg-accent/10 text-accent",
  completed: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export default function Dashboard() {
  const [domains, setDomains] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:4000/domains").then((r) => r.json()),
      fetch("http://localhost:4000/runs").then((r) => r.json()),
    ])
      .then(([domainsData, runsData]) => {
        setDomains(domainsData);
        setRuns(runsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const verifiedCount = domains.filter((d) => d.verified).length;
  const runningCount = runs.filter((r) => r.status === "running").length;

  return (
    <DashboardLayout crumb="BreakBot / Dashboard" title="Dashboard">
      <div className="flex items-center justify-between -mt-4 mb-8">
        <p className="text-slate-400 text-sm">
          An overview of your security testing activity.
        </p>
        <Link
          to="/scan/new"
          className="flex items-center gap-2 bg-accent text-ink font-medium text-sm rounded-lg px-4 py-2 hover:opacity-90 transition"
        >
          <Plus size={16} />
          New scan
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-line rounded-xl p-5 bg-panel/60">
          <p className="text-xs text-slate-500 mb-2">Total domains</p>
          <p className="text-2xl font-semibold">{loading ? "—" : domains.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {loading ? "" : `${verifiedCount} verified`}
          </p>
        </div>
        <div className="border border-line rounded-xl p-5 bg-panel/60">
          <p className="text-xs text-slate-500 mb-2">Total scans</p>
          <p className="text-2xl font-semibold">{loading ? "—" : runs.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            {loading ? "" : `${runningCount} in progress`}
          </p>
        </div>
      </div>

      <div className="border border-line rounded-xl bg-panel/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="font-medium">Recent test runs</h2>
            <p className="text-xs text-slate-500">Your latest application security scans</p>
          </div>
        </div>

        {loading && (
          <p className="px-5 py-6 text-sm text-slate-500">Loading...</p>
        )}

        {!loading && runs.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-slate-400">No scans yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Verify a domain and run your first scan to see results here.
            </p>
            <Link
              to="/scan/new"
              className="inline-block mt-4 text-xs text-accent hover:underline"
            >
              Start a scan
            </Link>
          </div>
        )}

        {!loading && runs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-line">
                <th className="px-5 py-3 font-normal">Run ID</th>
                <th className="px-5 py-3 font-normal">Domain</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-white/5">
                  <td className="px-5 py-3">
                    <Link to={`/report/${r.id}`} className="text-accent hover:underline">
                      BB-{r.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{r.url}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(r.started_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}