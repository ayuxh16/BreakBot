import { useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Download, CheckCircle2 } from "lucide-react";

const summary = [
  { label: "Critical findings", value: 2, color: "text-red-400" },
  { label: "High findings", value: 5, color: "text-orange-400" },
  { label: "Medium findings", value: 11, color: "text-yellow-400" },
  { label: "Low findings", value: 7, color: "text-slate-400" },
];

const findings = [
  { severity: "Critical", title: "Insecure direct object reference", endpoint: "GET /api/orders/:id", category: "Access control" },
  { severity: "Critical", title: "Checkout price can be altered", endpoint: "POST /api/checkout", category: "Business logic" },
  { severity: "High", title: "Reflected cross-site scripting", endpoint: "GET /search?q=", category: "Input validation" },
  { severity: "Medium", title: "Missing Content Security Policy", endpoint: "GET /", category: "Security headers" },
  { severity: "Medium", title: "Rate limiting absent on login", endpoint: "POST /api/auth/login", category: "Authentication" },
  { severity: "Low", title: "Cookie missing SameSite attribute", endpoint: "POST /api/auth/session", category: "Session security" },
];

const severityStyles = {
  Critical: "bg-red-500/10 text-red-400",
  High: "bg-orange-500/10 text-orange-400",
  Medium: "bg-yellow-500/10 text-yellow-400",
  Low: "bg-slate-500/10 text-slate-400",
};

export default function FindingsReport() {
  const { runId } = useParams();

  return (
    <DashboardLayout crumb="BreakBot / Findings Report" title="Findings Report">
      <div className="flex items-center justify-between -mt-4 mb-8">
        <p className="text-slate-400 text-sm">
          Security analysis for shop.demo.dev - Run {runId ?? "BB-1040"}
        </p>
        <button className="flex items-center gap-2 border border-line rounded-lg px-4 py-2 text-sm hover:bg-white/5 transition">
          <Download size={14} />
          Export report
        </button>
      </div>

      <div className="border border-accent/30 bg-accent/5 rounded-xl px-5 py-4 mb-8 flex items-start gap-3">
        <CheckCircle2 size={18} className="text-accent mt-0.5" />
        <div>
          <p className="text-sm font-medium">Demo scan complete</p>
          <p className="text-xs text-slate-400">
            These sample findings are illustrative. No security test was
            performed against this domain. - Sep 22, 2026
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-10">
        {summary.map((s) => (
          <div key={s.label} className="border border-line rounded-xl p-5 bg-panel/60">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-line rounded-xl bg-panel/60">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <h2 className="font-medium">Findings</h2>
            <p className="text-xs text-slate-500">
              6 sample findings with reproducible evidence
            </p>
          </div>
          <span className="text-xs text-slate-500">Sorted by severity</span>
        </div>

        <div className="divide-y divide-line">
          {findings.map((f) => (
            <div key={f.title} className="px-5 py-4 flex items-center justify-between hover:bg-white/5">
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${severityStyles[f.severity]}`}>
                  {f.severity}
                </span>
                <div>
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-xs text-slate-500">
                    {f.endpoint} - {f.category}
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} />
                Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 text-center mt-6">
        This is a demo report. Never assume a site is secure based on sample
        findings.
      </p>
    </DashboardLayout>
  );
}