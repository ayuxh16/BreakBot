import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { ShieldCheck, ShieldAlert } from "lucide-react";

const depths = [
  { id: "quick", label: "Quick", body: "Fast pass over the most common issues." },
  { id: "standard", label: "Standard", body: "Balanced coverage of pages, APIs, and common issues." },
  { id: "deep", label: "Deep", body: "Thorough crawl and extended business-logic analysis." },
];

export default function NewScan() {
  const [depth, setDepth] = useState("standard");
  const [authRequired, setAuthRequired] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(true);
  const [safeMode, setSafeMode] = useState(true);

  const [targetUrl, setTargetUrl] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

async function handleVerify() {
  setLoading(true);
  setError(null);
  setVerifyResult(null);
  try {
    const sessionToken = localStorage.getItem("breakbot_session");
    const res = await fetch("http://localhost:4000/verify/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: targetUrl, sessionToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");
    setVerifyResult(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}

  async function handleCheckNow() {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch("http://localhost:4000/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: targetUrl }),
      });
      const data = await res.json();
      setCheckResult(data.verified ? "verified" : "not-verified");
    } catch (err) {
      setCheckResult("error");
    } finally {
      setChecking(false);
    }
  }

  return (
    <DashboardLayout crumb="BreakBot / New Scan" title="New Scan">
      <p className="text-slate-400 text-sm -mt-4 mb-8">
        Configure a test for an application you own.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-line rounded-xl bg-panel/60 p-6 space-y-6">
          <div>
            <h2 className="font-medium">Configure your scan</h2>
            <p className="text-xs text-slate-500">
              Choose a verified target and how deeply to test it.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Target URL *</label>
            <input
              type="url"
              placeholder="https://shop.demo.dev"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="mt-2 w-full bg-white/5 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Only verified domains in your workspace can be scanned.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Scan depth</label>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {depths.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDepth(d.id)}
                  className={`text-left border rounded-lg p-3 transition ${
                    depth === d.id
                      ? "border-accent bg-accent/10"
                      : "border-line hover:bg-white/5"
                  }`}
                >
                  <p className="text-sm font-medium">{d.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{d.body}</p>
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            title="Authentication required"
            body="Include authenticated routes in this scan"
            checked={authRequired}
            onChange={setAuthRequired}
          />
          <ToggleRow
            title="AI business logic analysis"
            body="Analyze workflows for unexpected behavior"
            checked={aiAnalysis}
            onChange={setAiAnalysis}
          />
          <ToggleRow
            title="Safe mode"
            body="Avoid potentially destructive test actions"
            checked={safeMode}
            onChange={setSafeMode}
          />

          <button
            onClick={handleVerify}
            disabled={loading || !targetUrl}
            className="w-full bg-accent text-ink font-medium rounded-lg py-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Starting verification..." : "Verify domain"}
          </button>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {verifyResult && (
            <div className="border border-accent/30 bg-accent/5 rounded-lg p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">
                  Add this TXT record to verify ownership:
                </p>
                <code className="block bg-black/30 rounded px-2 py-1 text-xs break-all">
                  {verifyResult.token}
                </code>
              </div>

              <button
                onClick={handleCheckNow}
                disabled={checking}
                className="text-xs text-accent hover:underline disabled:opacity-50"
              >
                {checking ? "Checking..." : "I've added the record — check now"}
              </button>

              {checkResult === "verified" && (
                <p className="text-xs text-emerald-400">✔ Verified!</p>
              )}
              {checkResult === "not-verified" && (
                <p className="text-xs text-slate-400">
                  Not verified yet — DNS may still be propagating. Try again in a minute.
                </p>
              )}
              {checkResult === "error" && (
                <p className="text-xs text-red-400">
                  Something went wrong checking verification.
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 text-center">
            This is a simulated scan. No requests will be sent to the target.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border border-line rounded-xl bg-panel/60 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-accent" />
              <h3 className="text-sm font-medium">Only scan what you own.</h3>
            </div>
            <p className="text-xs text-slate-500">
              BreakBot requires domain ownership verification before a scan
              can begin. Testing without permission is never allowed.
            </p>
            <a href="/domains" className="text-xs text-accent hover:underline block mt-3">
              Manage domains
            </a>
          </div>

          <div className="border border-line rounded-xl bg-panel/60 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert size={16} className="text-accent" />
              <h3 className="text-sm font-medium">About safe mode</h3>
            </div>
            <p className="text-xs text-slate-500">
              Safe mode avoids actions that could change application data.
              It's on by default and recommended for production sites.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({ title, body, checked, onChange }) {
  return (
    <div className="flex items-center justify-between border border-line rounded-lg px-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-500">{body}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full relative transition-colors ${
          checked ? "bg-accent" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-ink transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}