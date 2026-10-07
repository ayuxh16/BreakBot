import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { CheckCircle2 } from "lucide-react";

const severityStyles = {
  critical: "bg-red-500/10 text-red-400",
  high: "bg-orange-500/10 text-orange-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low: "bg-slate-500/10 text-slate-400",
};

export default function FindingsReport() {
  const { runId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/runs/${runId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Run not found");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <DashboardLayout crumb="BreakBot / Findings Report" title="Findings Report">
        <p className="text-sm text-slate-500">Loading...</p>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout crumb="BreakBot / Findings Report" title="Findings Report">
        <p className="text-sm text-red-400">{error || "No data found for this run."}</p>
      </DashboardLayout>
    );
  }

  const { run, findings } = data;
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  findings.forEach((f) => {
    if (counts[f.severity] !== undefined) counts[f.severity]++;
  });

  return (
    <DashboardLayout crumb="BreakBot / Findings Report" title="Findings Report">
      <p className="text-slate-400 text-sm -mt-4 mb-8">
        Security analysis for {run.url} · Run BB-{run.id}
      </p>

      <div className="border border-accent/30 bg-accent/5 rounded-xl px-5 py-4 mb-8 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-accent mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            Scan {run.status} — {findings.length} finding{findings.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-slate-400">
            Started {new Date(run.started_at).toLocaleString()}
            {run.completed_at && ` · Completed ${new Date(run.completed_at).toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {Object.entries(counts).map(([sev, count]) => (
          <div key={sev} className="border border-line rounded-xl p-5 bg-panel/60">
            <p className="text-2xl font-semibold capitalize">{count}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{sev} findings</p>
          </div>
        ))}
      </div>

      <div className="border border-line rounded-xl bg-panel/60">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-medium">Findings</h2>
        </div>

        {findings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No findings for this run.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {findings.map((f) => (
              <div key={f.id} className="px-5 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 capitalize ${severityStyles[f.severity] || ""}`}>
                    {f.severity}
                  </span>
                  <p className="text-sm font-medium">{f.title}</p>
                </div>
                {f.detail && (
                  <p className="text-xs text-slate-500 ml-1">{f.detail}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}