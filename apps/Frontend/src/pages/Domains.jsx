import { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanningId, setScanningId] = useState(null);

  useEffect(() => {
    fetch("http://localhost:4000/domains")
      .then((res) => res.json())
      .then((data) => setDomains(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function runScan(domainId) {
    setScanningId(domainId);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      window.location.href = `/report/${data.runId}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setScanningId(null);
    }
  }

  return (
    <DashboardLayout crumb="BreakBot / Domains" title="Domains">
      <p className="text-slate-400 text-sm -mt-4 mb-8">
        Domains you've submitted for verification.
      </p>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      {scanningId !== null && (
        <p className="text-xs text-slate-400 mb-4">
          Crawling and scanning. This can take a minute, so please keep this page open.
        </p>
      )}

      {!loading && !error && domains.length === 0 && (
        <p className="text-sm text-slate-500">No domains yet. Add one from New Scan.</p>
      )}

      <div className="border border-line rounded-xl bg-panel/60 divide-y divide-line">
        {domains.map((d) => (
          <div key={d.id} className="px-5 py-4 flex items-center justify-between">
            <span className="text-sm">{d.url}</span>
            <div className="flex items-center">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  d.verified
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {d.verified ? "Verified" : "Pending"}
              </span>

              {d.verified && (
                <button
                  onClick={() => runScan(d.id)}
                  disabled={scanningId !== null}
                  className="text-xs text-accent hover:underline ml-3 disabled:opacity-50"
                >
                  {scanningId === d.id ? "Scanning..." : "Run scan"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}