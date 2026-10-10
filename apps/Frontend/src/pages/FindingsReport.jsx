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

const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function groupFindings(findings) {
  const groups = new Map();

  for (const f of findings) {
    const key = `${f.severity}::${f.title}`;
    if (!groups.has(key)) {
      groups.set(key, {
        severity: f.severity,
        title: f.title,
        detail: f.detail,
        instances: [],
      });
    }
    groups.get(key).instances.push(f);
  }

  return [...groups.values()].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

export default function FindingsReport() {
  const { runId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

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

  const groups = groupFindings(findings);

  return (
    <DashboardLayout crumb="BreakBot / Findings Report" title="Findings Report">
      <p className="text-slate-400 text-sm -mt-4 mb-8">
        Security analysis for {run.url} · Run BB-{run.id}
      </p>

      <div className="border border-accent/30 bg-accent/5 rounded-xl px-5 py-4 mb-8 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-accent mt-0.5" />
        <div>
          <p className="text-sm font-medium">
            Scan {run.status} — {groups.length} issue{groups.length !== 1 ? "s" : ""}
            {run.pages_scanned > 0 && ` across ${run.pages_scanned} pages`}
          </p>
          <p className="text-xs text-slate-400">
            Started {new Date(run.started_at).toLocaleString()}
            {run.completed_at && ` · Finished ${new Date(run.completed_at).toLocaleString()}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {Object.entries(counts).map(([sev, count]) => (
          <div key={sev} className="border border-line rounded-xl p-5 bg-panel/60">
            <p className="text-2xl font-semibold">{count}</p>
            <p className="text-xs text-slate-500 mt-1 capitalize">{sev} findings</p>
          </div>
        ))}
      </div>

      <div className="border border-line rounded-xl bg-panel/60">
        <div className="px-5 py-4 border-b border-line">
          <h2 className="font-medium">Findings</h2>
          <p className="text-xs text-slate-500">
            Grouped by issue · click a row to see every affected page
          </p>
        </div>

        {groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No findings for this run.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {groups.map((g, i) => {
              const isOpen = expanded === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 hover:bg-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-xs px-2 py-1 rounded-full shrink-0 capitalize ${
                          severityStyles[g.severity] || ""
                        }`}
                      >
                        {g.severity}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{g.title}</p>
                        {g.detail && (
                          <p className="text-xs text-slate-500 truncate">{g.detail}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {g.instances.length} page{g.instances.length !== 1 ? "s" : ""}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 space-y-4">
                      {g.instances.map((f) => (
                        <div
                          key={f.id}
                          className="border border-line rounded-lg p-3 bg-black/10"
                        >
                          <p className="text-xs text-slate-400 break-all mb-2">
                            {f.page_url}
                          </p>

                          {f.evidence && (
                            <details>
                              <summary className="text-xs text-accent cursor-pointer">
                                Show proof
                              </summary>
                              <div className="mt-2 space-y-3">
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">
                                    Replay with curl
                                  </p>
                                  <code className="block bg-black/30 rounded px-2 py-1 text-xs break-all">
                                    {f.evidence.curl}
                                  </code>
                                </div>
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">
                                    Response ({f.evidence.response?.status}) headers
                                  </p>
                                  <pre className="bg-black/30 rounded px-2 py-1 text-xs overflow-x-auto">
                                    {JSON.stringify(f.evidence.response?.headers, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}