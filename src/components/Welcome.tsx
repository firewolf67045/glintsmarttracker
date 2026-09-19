import { useState } from "react";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import mascot from "@/assets/bodybuilder-mascot.png";
import { LanguageSelect } from "@/components/LanguageSelect";
import { LANGUAGE_KEY, translate, type Language } from "@/lib/i18n";

type Mode = "welcome" | "signup" | "login";

export function Welcome({ language, onLanguageChange }: { language: Language; onLanguageChange: (language: Language) => void }) {
  const [mode, setMode] = useState<Mode>("welcome");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const t = (key: string) => translate(language, key);

  function triggerShake(msg: string) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return triggerShake("Password must have at least 6 characters.");
    if (password !== confirm) return triggerShake("Passwords don't match.");
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
    <div className="welcome-stage min-h-screen flex flex-col items-center justify-center px-5 py-8 relative overflow-hidden">
      <div className="absolute right-5 top-5 z-20">
        <LanguageSelect value={language} onChange={(next) => { localStorage.setItem(LANGUAGE_KEY, next); onLanguageChange(next); }} />
      </div>
      {/* floating sparkles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <Sparkles
          key={i}
          className="absolute text-primary/25 animate-pulse"
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
           <div className="absolute -top-2 -right-4 bg-card rounded-xl rounded-br-sm px-4 py-2 shadow-card max-w-[180px] border border-primary/40">
            <p className="text-sm font-bold text-foreground leading-tight">
              {mode === "welcome" && "No email, no gains. Let's do this!"}
              {mode === "signup" && "Time to flex those fingers 💪"}
              {mode === "login" && "Welcome back, champ!"}
            </p>
          </div>
        </div>

        {mode === "welcome" && (
          <div className="w-full mt-4 text-center animate-fade-in">
             <h1 className="text-4xl font-black text-foreground">{t("welcomeTitle")}</h1>
             <p className="mt-2 text-muted-foreground font-medium">{t("welcomeSub")}</p>

            <div className="mt-8 space-y-3 w-full">
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-lg shadow-glow hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                📧 {t("signup")}
              </button>
              <button
                onClick={() => { setMode("login"); setError(null); }}
                className="w-full bg-secondary text-secondary-foreground border border-border font-bold py-4 rounded-lg shadow-card hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                🔐 {t("login")}
              </button>
            </div>

             <p className="mt-6 text-xs text-muted-foreground px-4">
               {t("privacy")}
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
            <h2 className="text-2xl font-black text-foreground text-center mb-2">
              {mode === "signup" ? t("create") : t("login")}
            </h2>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-700" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className="w-full bg-card pl-11 pr-4 py-4 rounded-lg font-medium text-foreground placeholder:text-muted-foreground shadow border border-border focus:border-primary outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-700" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
                className="w-full bg-card pl-11 pr-12 py-4 rounded-lg font-medium text-foreground placeholder:text-muted-foreground shadow border border-border focus:border-primary outline-none"
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
                  placeholder={t("confirm")}
                  className="w-full bg-card pl-11 pr-4 py-4 rounded-lg font-medium text-foreground placeholder:text-muted-foreground shadow border border-border focus:border-primary outline-none"
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
              className="w-full bg-primary text-primary-foreground font-black py-4 rounded-lg shadow-glow hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === "signup" ? `${t("letsGo")} 💪` : t("login")}
            </button>

            <button
              type="button"
              onClick={() => { setMode("welcome"); setError(null); }}
              className="w-full text-muted-foreground font-semibold py-2 text-sm underline"
            >
              ← {t("back")}
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
