import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); //email-> uska code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRequestOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");

      localStorage.setItem("breakbot_session", data.sessionToken);
      localStorage.setItem("breakbot_user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-line rounded-xl bg-panel/60 p-6">
        <h1 className="text-lg font-semibold mb-1">
          breakbot<span className="text-accent">.</span>
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          {step === "email" ? "Sign in to continue" : `Enter the code sent to ${email}`}
        </p>

        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-ink font-medium rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit code"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-white/5 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-accent tracking-widest"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-ink font-medium rounded-lg py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-xs text-slate-400 hover:text-slate-200"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && <p className="text-xs text-red-400 mt-3 text-center">{error}</p>}

        <p className="text-xs text-slate-500 mt-4 text-center">
          For now, check your backend terminal for the code (no real email sending yet).
        </p>
      </div>
    </div>
  );
}