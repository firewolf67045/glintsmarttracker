import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Sparkles, Trash2, Loader2, Plus, Flame, X, Type as TypeIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glint — AI Calorie Tracking" },
      { name: "description", content: "Snap your meal. AI counts calories and macros instantly." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: GlintApp,
});

type Meal = {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  portion: string;
  image?: string;
  ts: number;
};

const DAILY_GOAL = 2000;
const STORAGE_KEY = "glint.meals.v1";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function GlintApp() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheet, setSheet] = useState<"closed" | "choose" | "text" | "preview">("closed");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState<Meal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMeals(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meals)); } catch {}
  }, [meals]);

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
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setPreview({
        id: crypto.randomUUID(),
        name: data.name || "Meal",
        calories: Math.round(data.calories || 0),
        carbs: Math.round(data.carbs || 0),
        protein: Math.round(data.protein || 0),
        fat: Math.round(data.fat || 0),
        portion: data.portion || "",
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
  }

  const pct = Math.min(100, (totals.cal / DAILY_GOAL) * 100);

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      {/* Header */}
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
        <div className="text-right">
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Goal</div>
          <div className="font-display font-bold">{DAILY_GOAL} <span className="text-xs text-muted-foreground font-medium">kcal</span></div>
        </div>
      </header>

      {/* Daily ring + macros */}
      <section className="px-5 max-w-2xl mx-auto">
        <div className="rounded-3xl bg-gradient-card border border-border p-6 shadow-card">
          <div className="flex items-center gap-6">
            <RingProgress pct={pct} value={Math.round(totals.cal)} />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Today</div>
              <div className="font-display font-bold text-3xl leading-tight">
                {Math.round(totals.cal)}<span className="text-base text-muted-foreground font-medium"> / {DAILY_GOAL} kcal</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {DAILY_GOAL - totals.cal > 0 ? `${DAILY_GOAL - totals.cal} kcal remaining` : `${totals.cal - DAILY_GOAL} over goal`}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <MacroBar label="Carbs" grams={totals.c} color="var(--carb)" goal={250} />
            <MacroBar label="Protein" grams={totals.p} color="var(--protein)" goal={120} />
            <MacroBar label="Fat" grams={totals.f} color="var(--fat)" goal={70} />
          </div>
        </div>
      </section>

      {/* Meals list */}
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
              <MealRow key={m.id} meal={m} onDelete={() => deleteMeal(m.id)} />
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setSheet("choose")}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 h-16 w-16 rounded-full bg-gradient-mint text-primary-foreground shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
        aria-label="Add meal"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {/* Hidden file inputs */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {/* Bottom sheet */}
      {sheet !== "closed" && (
        <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={closeSheet}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-card border-t border-border rounded-t-3xl p-5 pb-8 shadow-card animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
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
                <p className="text-sm text-muted-foreground mb-5">AI will estimate the calories and macros.</p>
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
                    <p className="text-sm text-muted-foreground mt-1">AI is identifying ingredients & portions</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm">
                    <div className="font-semibold text-destructive mb-1">Couldn't analyze</div>
                    <div className="text-muted-foreground">{error}</div>
                  </div>
                )}

                {preview && !loading && (
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="font-display font-bold text-2xl leading-tight">{preview.name}</h3>
                        {preview.portion && <div className="text-sm text-muted-foreground">{preview.portion}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-display font-bold text-3xl text-gradient-mint">{preview.calories}</div>
                        <div className="text-xs text-muted-foreground -mt-1">kcal</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <MacroPill label="Carbs" grams={preview.carbs} color="var(--carb)" />
                      <MacroPill label="Protein" grams={preview.protein} color="var(--protein)" />
                      <MacroPill label="Fat" grams={preview.fat} color="var(--fat)" />
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button onClick={closeSheet} className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-semibold">
                        Discard
                      </button>
                      <button onClick={logMeal} className="flex-[2] py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-semibold shadow-glow">
                        Log meal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button onClick={closeSheet} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-muted flex items-center justify-center" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
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

function MealRow({ meal, onDelete }: { meal: Meal; onDelete: () => void }) {
  const time = new Date(meal.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition group">
      {meal.image ? (
        <img src={meal.image} alt={meal.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="h-14 w-14 rounded-xl bg-gradient-mint/20 flex items-center justify-center shrink-0">
          <TypeIcon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{meal.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{time}</span>
          <span>·</span>
          <span>C {meal.carbs}g</span>
          <span>P {meal.protein}g</span>
          <span>F {meal.fat}g</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-display font-bold">{meal.calories}</div>
        <div className="text-[10px] text-muted-foreground -mt-1">kcal</div>
      </div>
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
