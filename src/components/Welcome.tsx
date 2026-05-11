import { useState } from "react";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import mascot from "@/assets/bodybuilder-mascot.png";

type Mode = "welcome" | "signup" | "login";

export function Welcome() {
  const [mode, setMode] = useState<Mode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  function triggerShake(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return triggerShake("Password too weak, champ. 6+ characters.");
    if (password !== confirm) return triggerShake("Passwords don't match, champ");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) return triggerShake(error.message);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return triggerShake(error.message);
  }

  const strength = Math.min(4, Math.floor(password.length / 3));
  const flex = ["", "💪", "💪💪", "💪💪💪", "💪💪💪💪"][strength];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d4f5b5] via-[#a8e6a3] to-[#7dd3a8] flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      {/* floating sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Sparkles
          key={i}
          className="absolute text-white/60 animate-pulse"
          style={{
            top: `${(i * 37) % 90}%`,
            left: `${(i * 53) % 90}%`,
            width: 12 + (i % 3) * 6,
            height: 12 + (i % 3) * 6,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Mascot */}
        <div className="relative">
          <img
            src={mascot}
            alt="Glint mascot"
            width={1024}
            height={1024}
            className="w-56 h-56 object-contain drop-shadow-2xl"
          />
          {/* Speech bubble */}
          <div className="absolute -top-2 -right-4 bg-white rounded-2xl rounded-br-sm px-4 py-2 shadow-lg max-w-[180px] border-2 border-green-700">
            <p className="text-sm font-bold text-green-900 leading-tight">
              {mode === "welcome" && "No email, no gains. Let's do this!"}
              {mode === "signup" && "Time to flex those fingers 💪"}
              {mode === "login" && "Welcome back, champ!"}
            </p>
          </div>
        </div>

        {mode === "welcome" && (
          <div className="w-full mt-4 text-center animate-fade-in">
            <h1 className="text-4xl font-black text-green-950 tracking-tight">Fuel like a champ.</h1>
            <p className="mt-2 text-green-900/80 font-medium">Snap, track, and eat smarter with Glint.</p>

            <div className="mt-8 space-y-3 w-full">
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                className="w-full bg-white text-green-900 font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                📧 Sign up with email
              </button>
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className="w-full bg-green-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                🔐 Log in
              </button>
            </div>

            <p className="mt-6 text-xs text-green-900/70 px-4">
              By continuing, you agree to our Terms. We don't sell your data — promise.
            </p>
          </div>
        )}

        {(mode === "signup" || mode === "login") && (
          <form
            onSubmit={mode === "signup" ? handleSignup : handleLogin}
            className={`w-full mt-4 space-y-3 animate-fade-in ${shake ? "animate-[shake_0.4s]" : ""}`}
            style={{
              animationName: shake ? "shake" : undefined,
            }}
          >
            <h2 className="text-2xl font-black text-green-950 text-center mb-2">
              {mode === "signup" ? "Create account" : "Log in"}
            </h2>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-700" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-white pl-11 pr-4 py-4 rounded-2xl font-medium text-green-950 placeholder:text-green-900/40 shadow border-2 border-transparent focus:border-green-700 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-700" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white pl-11 pr-12 py-4 rounded-2xl font-medium text-green-950 placeholder:text-green-900/40 shadow border-2 border-transparent focus:border-green-700 outline-none"
              />
              {mode === "signup" && password && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">{flex}</span>
              )}
            </div>

            {mode === "signup" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-700" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-white pl-11 pr-4 py-4 rounded-2xl font-medium text-green-950 placeholder:text-green-900/40 shadow border-2 border-transparent focus:border-green-700 outline-none"
                />
              </div>
            )}

            {error && (
              <p className="text-sm font-bold text-red-700 bg-red-100 rounded-xl px-3 py-2 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-900 text-white font-black py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "signup" ? "Let's Go 💪" : "Log in"}
            </button>

            <button
              type="button"
              onClick={() => { setMode("welcome"); setError(null); }}
              className="w-full text-green-900 font-semibold py-2 text-sm underline"
            >
              ← Back
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
