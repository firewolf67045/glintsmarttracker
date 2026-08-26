import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Sparkles, Trash2, Loader2, Plus, Flame, X, Type as TypeIcon, Zap, Leaf, Moon, Heart, Sun, Lightbulb, Target, LogOut, Activity } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Welcome } from "@/components/Welcome";
import { BodyScan, loadSavedScan, type BodyScanResult } from "@/components/BodyScan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glint — AI Calorie Tracking" },
      { name: "description", content: "Snap your meal. AI counts calories, macros, micros and gives a Glint Score." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <Welcome />;
  return <GlintApp />;
}

type Verdict = "green" | "yellow" | "red";
type Mood = "energy" | "heavy" | "nutrient" | "comfort" | "light";

type Meal = {
  id: string;
  name: string;
  description?: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  saturatedFat?: number;
  sugar?: number;
  fiber?: number;
  sodium?: number;
  cholesterol?: number;
  micros?: Record<string, number>;
  portion: string;
  verdict?: Verdict;
  verdictReason?: string;
  takeaway?: string;
  mood?: Mood;
  funFact?: string;
  glintScore?: number;
  goalInsight?: string;
  image?: string;
  ts: number;
};

const DAILY_GOAL = 2000;
const STORAGE_KEY = "glint.meals.v2";
const GOAL_KEY = "glint.goal.v1";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function GlintApp() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [goal, setGoal] = useState<string>("balanced");
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<"closed" | "choose" | "text" | "preview">("closed");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState<Meal | null>(null);
  const [detail, setDetail] = useState<Meal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showScan, setShowScan] = useState(false);
  const [scan, setScan] = useState<BodyScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMeals(JSON.parse(raw));
      const g = localStorage.getItem(GOAL_KEY);
      if (g) setGoal(g);
      setScan(loadSavedScan());
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meals)); } catch {}
  }, [meals]);

  useEffect(() => {
    try { localStorage.setItem(GOAL_KEY, goal); } catch {}
  }, [goal]);

  const today = meals.filter((m) => {
    const d = new Date(m.ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey();
  });

  const totals = today.reduce(
    (a, m) => ({ cal: a.cal + m.calories, c: a.c + m.carbs, p: a.p + m.protein, f: a.f + m.fat }),
    { cal: 0, c: 0, p: 0, f: 0 }
  );

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function handleFile(f: File) {
    const dataUrl = await fileToDataUrl(f);
    setPendingImage(dataUrl);
    setSheet("preview");
    analyze({ image: dataUrl });
  }

  async function analyze(payload: { image?: string; text?: string }) {
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setPreview({
        id: crypto.randomUUID(),
        name: data.name || "Meal",
        description: data.description,
        calories: Math.round(data.calories || 0),
        carbs: Math.round(data.carbs || 0),
        protein: Math.round(data.protein || 0),
        fat: Math.round(data.fat || 0),
        saturatedFat: round1(data.saturatedFat),
        sugar: round1(data.sugar),
        fiber: round1(data.fiber),
        sodium: Math.round(data.sodium || 0),
        cholesterol: Math.round(data.cholesterol || 0),
        micros: data.micros || {},
        portion: data.portion || "",
        verdict: (data.verdict as Verdict) || "yellow",
        verdictReason: data.verdictReason,
        takeaway: data.takeaway,
        mood: (data.mood as Mood) || "light",
        funFact: data.funFact,
        glintScore: Math.round(data.glintScore || 0),
        goalInsight: data.goalInsight,
        image: payload.image,
        ts: Date.now(),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function logMeal() {
    if (!preview) return;
    setMeals((prev) => [preview, ...prev]);
    closeSheet();
  }

  function closeSheet() {
    setSheet("closed");
    setPendingImage(null);
    setPreview(null);
    setTextInput("");
    setError(null);
  }

  function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setDetail(null);
  }

  const calorieTarget = scan?.targetCalories && scan.targetCalories > 0 ? Math.round(scan.targetCalories) : DAILY_GOAL;
  const pct = Math.min(100, (totals.cal / calorieTarget) * 100);

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <header className="px-5 pt-7 pb-5 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-mint shadow-glow flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">glint</div>
            <div className="text-[11px] text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="text-xs bg-card border border-border rounded-lg px-2 py-1.5 font-medium"
            aria-label="Goal"
          >
            <option value="balanced">⚖️ Balanced</option>
            <option value="muscle gain">💪 Muscle</option>
            <option value="fat loss">🔥 Fat loss</option>
            <option value="energy">⚡ Energy</option>
          </select>
          <button
            onClick={() => supabase.auth.signOut()}
            className="h-8 w-8 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      <section className="px-5 max-w-2xl mx-auto">
        <div className="rounded-3xl bg-gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-6">
            <RingProgress pct={pct} value={Math.round(totals.cal)} />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today</div>
              <div className="font-display font-bold text-3xl leading-tight">
                {Math.round(totals.cal)}<span className="text-base text-muted-foreground font-medium"> / {calorieTarget} kcal</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {calorieTarget - totals.cal > 0 ? `${Math.round(calorieTarget - totals.cal)} kcal remaining` : `${Math.round(totals.cal - calorieTarget)} over goal`}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <MacroBar label="Carbs" grams={totals.c} color="var(--carb)" goal={scan?.macros?.carbs || 250} />
            <MacroBar label="Protein" grams={totals.p} color="var(--protein)" goal={scan?.macros?.protein || 120} />
            <MacroBar label="Fat" grams={totals.f} color="var(--fat)" goal={scan?.macros?.fat || 70} />
          </div>
        </div>
      </section>

      <section className="px-5 mt-4 max-w-2xl mx-auto">
        <button
          onClick={() => setShowScan(true)}
          className="w-full text-left rounded-3xl bg-gradient-card border border-border p-5 shadow-card hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-mint shadow-glow flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold">Body Scan</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {scan
                  ? `${scan.bodyFat}% body fat · ${Math.round(scan.targetCalories)} kcal target — tap to rescan`
                  : "Snap your physique + age & weight for a body fat estimate, calorie target and meal plan."}
              </p>
            </div>
          </div>
        </button>
      </section>

      <section className="px-5 mt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Today's meals</h2>
          <span className="text-xs text-muted-foreground">{today.length} logged</span>
        </div>

        {today.length === 0 ? (
          <div className="rounded-3xl bg-card/50 border border-dashed border-border p-10 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-mint/20 flex items-center justify-center mx-auto mb-3">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div className="font-semibold mb-1">No meals yet</div>
            <p className="text-sm text-muted-foreground">Tap the + button to snap your first meal</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {today.map((m) => (
              <MealRow key={m.id} meal={m} onOpen={() => setDetail(m)} onDelete={() => deleteMeal(m.id)} />
            ))}
          </div>
        )}
      </section>

      <p className="px-5 mt-6 max-w-2xl mx-auto text-[11px] leading-relaxed text-muted-foreground text-center">
        Glint provides AI-estimated nutrition information for general wellness only. It is not medical,
        dietary, or diagnostic advice. Meal photos are sent to an AI service for analysis and are never sold.
      </p>


      <button
        onClick={() => setSheet("choose")}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 h-16 w-16 rounded-full bg-gradient-mint text-primary-foreground shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
        aria-label="Add meal"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {showScan && (
        <BodyScan goal={goal} onClose={() => setShowScan(false)} onResult={(r) => setScan(r)} />
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {sheet !== "closed" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={closeSheet}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-card border-t border-border rounded-t-3xl p-5 pb-8 shadow-card animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-5" />

            {sheet === "choose" && (
              <div>
                <h3 className="font-display font-bold text-xl mb-1">Log a meal</h3>
                <p className="text-sm text-muted-foreground mb-5">Pick how you want to add it.</p>
                <div className="space-y-2.5">
                  <SheetBtn icon={<Camera className="h-5 w-5" />} title="Take photo" desc="Snap your meal with the camera"
                    onClick={() => cameraRef.current?.click()} />
                  <SheetBtn icon={<Plus className="h-5 w-5" />} title="Upload photo" desc="Choose from your gallery"
                    onClick={() => fileRef.current?.click()} />
                  <SheetBtn icon={<TypeIcon className="h-5 w-5" />} title="Describe in text" desc="e.g. 'large salmon bowl'"
                    onClick={() => setSheet("text")} />
                </div>
              </div>
            )}

            {sheet === "text" && (
              <div>
                <h3 className="font-display font-bold text-xl mb-1">Describe your meal</h3>
                <p className="text-sm text-muted-foreground mb-5">AI will estimate calories, macros and a Glint Score.</p>
                <textarea
                  autoFocus
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="e.g. Two scrambled eggs with avocado toast and orange juice"
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <button
                  onClick={() => { setSheet("preview"); analyze({ text: textInput }); }}
                  disabled={!textInput.trim()}
                  className="mt-4 w-full py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Analyze
                </button>
              </div>
            )}

            {sheet === "preview" && (
              <div>
                {pendingImage && (
                  <img src={pendingImage} alt="" className="w-full h-56 object-cover rounded-2xl mb-4" />
                )}

                {loading && (
                  <div className="py-10 text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-3" />
                    <div className="font-semibold">Analyzing your meal…</div>
                    <p className="text-sm text-muted-foreground mt-1">Reading ingredients, portions & nutrients</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm">
                    <div className="font-semibold text-destructive mb-1">Couldn't analyze</div>
                    <div className="text-muted-foreground">{error}</div>
                  </div>
                )}

                {preview && !loading && (
                  <>
                    <MealDetailContent meal={preview} />
                    <div className="flex gap-2 mt-5">
                      <button onClick={closeSheet} className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold">
                        Discard
                      </button>
                      <button onClick={logMeal} className="flex-[2] py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-semibold shadow-glow">
                        Log meal
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <button onClick={closeSheet} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-muted flex items-center justify-center" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-card border-t border-border rounded-t-3xl p-5 pb-8 shadow-card animate-in slide-in-from-bottom duration-300 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 rounded-full bg-border mx-auto mb-5" />
            {detail.image && (
              <img src={detail.image} alt={detail.name} className="w-full h-56 object-cover rounded-2xl mb-4" />
            )}
            <MealDetailContent meal={detail} />
            <button
              onClick={() => deleteMeal(detail.id)}
              className="mt-5 w-full py-4 rounded-2xl bg-destructive/10 text-destructive font-semibold border border-destructive/30 flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Delete meal
            </button>
            <button onClick={() => setDetail(null)} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-muted flex items-center justify-center" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function round1(n: unknown): number {
  const v = Number(n);
  if (!isFinite(v)) return 0;
  return Math.round(v * 10) / 10;
}

const VERDICT_META: Record<Verdict, { label: string; bg: string; fg: string; ring: string }> = {
  green: { label: "Glint-Green · Healthy", bg: "bg-emerald-500/15", fg: "text-emerald-400", ring: "ring-emerald-500/30" },
  yellow: { label: "Glint-Yellow · Moderate", bg: "bg-amber-500/15", fg: "text-amber-400", ring: "ring-amber-500/30" },
  red: { label: "Glint-Red · Limit", bg: "bg-rose-500/15", fg: "text-rose-400", ring: "ring-rose-500/30" },
};

const MOOD_META: Record<Mood, { icon: React.ReactNode; label: string }> = {
  energy: { icon: <Zap className="h-4 w-4" />, label: "High energy" },
  heavy: { icon: <Moon className="h-4 w-4" />, label: "Heavy & slow" },
  nutrient: { icon: <Leaf className="h-4 w-4" />, label: "Nutrient-dense" },
  comfort: { icon: <Heart className="h-4 w-4" />, label: "Comfort food" },
  light: { icon: <Sun className="h-4 w-4" />, label: "Light & fresh" },
};

function MealDetailContent({ meal }: { meal: Meal }) {
  const v = VERDICT_META[meal.verdict ?? "yellow"];
  const mood = MOOD_META[meal.mood ?? "light"];
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-2xl leading-tight">{meal.name}</h3>
          {meal.portion && <div className="text-sm text-muted-foreground">{meal.portion}</div>}
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold text-3xl text-gradient-mint">{meal.calories}</div>
          <div className="text-xs text-muted-foreground -mt-1">kcal</div>
        </div>
      </div>

      {meal.description && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 italic">"{meal.description}"</p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${v.bg} ${v.fg} ${v.ring}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" /> {v.label}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground">
          {mood.icon} {mood.label}
        </span>
        {typeof meal.glintScore === "number" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-mint text-primary-foreground">
            <Sparkles className="h-3 w-3" /> Glint Score {meal.glintScore}/100
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <MacroPill label="Carbs" grams={meal.carbs} color="var(--carb)" />
        <MacroPill label="Protein" grams={meal.protein} color="var(--protein)" />
        <MacroPill label="Fat" grams={meal.fat} color="var(--fat)" />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Nutrition Facts</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <FactRow label="Saturated fat" value={meal.saturatedFat} unit="g" />
          <FactRow label="Sugar" value={meal.sugar} unit="g" />
          <FactRow label="Fiber" value={meal.fiber} unit="g" />
          <FactRow label="Sodium" value={meal.sodium} unit="mg" />
          <FactRow label="Cholesterol" value={meal.cholesterol} unit="mg" />
          {meal.micros && Object.entries(meal.micros)
            .filter(([, val]) => Number(val) > 0)
            .map(([k, val]) => (
              <FactRow key={k} label={prettyMicro(k)} value={Number(val)} unit={k === "vitaminD" || k === "vitaminB12" ? "µg" : "mg"} />
            ))}
        </div>
      </div>

      {(meal.verdictReason || meal.takeaway) && (
        <div className={`mt-4 rounded-2xl p-4 ring-1 ${v.bg} ${v.ring}`}>
          {meal.verdictReason && <div className="text-sm">{meal.verdictReason}</div>}
          {meal.takeaway && <div className={`text-sm font-semibold mt-2 ${v.fg}`}>"{meal.takeaway}"</div>}
        </div>
      )}

      {meal.goalInsight && (
        <div className="mt-3 rounded-2xl p-4 border border-border bg-card flex gap-3">
          <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Goal insight</div>
            <div className="text-sm">{meal.goalInsight}</div>
          </div>
        </div>
      )}

      {meal.funFact && (
        <div className="mt-3 rounded-2xl p-4 border border-border bg-card flex gap-3">
          <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm"><span className="font-semibold">Did you know?</span> {meal.funFact}</div>
        </div>
      )}
    </div>
  );
}

function prettyMicro(k: string) {
  return ({
    calcium: "Calcium",
    iron: "Iron",
    potassium: "Potassium",
    vitaminC: "Vitamin C",
    vitaminD: "Vitamin D",
    vitaminB12: "Vitamin B12",
    magnesium: "Magnesium",
  } as Record<string, string>)[k] ?? k;
}

function FactRow({ label, value, unit }: { label: string; value?: number; unit: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between border-b border-border/50 pb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}<span className="text-xs text-muted-foreground font-normal ml-0.5">{unit}</span></span>
    </div>
  );
}

function RingProgress({ pct, value }: { pct: number; value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} stroke="var(--border)" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="url(#mintGrad)" strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
        <defs>
          <linearGradient id="mintGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.82 0.18 168)" />
            <stop offset="100%" stopColor="oklch(0.9 0.2 158)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Flame className="h-4 w-4 text-primary mb-0.5" />
        <div className="text-xs font-bold">{value}</div>
      </div>
    </div>
  );
}

function MacroBar({ label, grams, color, goal }: { label: string; grams: number; color: string; goal: number }) {
  const pct = Math.min(100, (grams / goal) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold">{Math.round(grams)}<span className="text-muted-foreground font-normal">g</span></div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MacroPill({ label, grams, color }: { label: string; grams: number; color: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-3 text-center">
      <div className="h-1 w-8 mx-auto rounded-full mb-2" style={{ background: color }} />
      <div className="font-display font-bold">{grams}<span className="text-xs text-muted-foreground font-medium">g</span></div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MealRow({ meal, onOpen, onDelete }: { meal: Meal; onOpen: () => void; onDelete: () => void }) {
  const time = new Date(meal.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const v = VERDICT_META[meal.verdict ?? "yellow"];
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition group">
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {meal.image ? (
          <img src={meal.image} alt={meal.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-gradient-mint/20 flex items-center justify-center shrink-0">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{meal.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{time}</span>
            <span>·</span>
            <span className={`inline-flex items-center gap-1 ${v.fg}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {typeof meal.glintScore === "number" ? `Glint ${meal.glintScore}` : v.label.split(" ")[0]}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-bold">{meal.calories}</div>
          <div className="text-[10px] text-muted-foreground -mt-1">kcal</div>
        </div>
      </button>
      <button onClick={onDelete} className="ml-1 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition opacity-0 group-hover:opacity-100" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function SheetBtn({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-background border border-border hover:border-primary/40 hover:bg-muted/30 transition text-left"
    >
      <div className="h-11 w-11 rounded-xl bg-gradient-mint flex items-center justify-center text-primary-foreground shrink-0 shadow-glow">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
