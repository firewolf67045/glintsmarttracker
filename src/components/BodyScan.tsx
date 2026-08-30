import { useRef, useState } from "react";
import { Camera, Loader2, X, Plus, Activity, Flame, Dumbbell, Target, CheckCircle2, AlertCircle, Repeat, Droplets, ShoppingBasket, Trophy, Lightbulb, Cookie, PlusCircle } from "lucide-react";

export type PlanMeal = {
  meal: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type BodyScanResult = {
  bodyFat: number;
  bodyFatRange: string;
  confidence: "high" | "medium" | "low";
  category: string;
  physiqueTitle?: string;
  physiqueEmoji?: string;
  physiqueSummary: string;
  leanMassKg: number;
  fatMassKg: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  targetRationale: string;
  macros: { protein: number; carbs: number; fat: number };
  proteinPerKg: number;
  weeklyChangeKg: number;
  timelineNote: string;
  strengths: string[];
  focusAreas: string[];
  mealPlan: PlanMeal[];
  weekPlan?: Array<{
    day: string;
    theme: string;
    emoji: string;
    totalCalories: number;
    meals: PlanMeal[];
  }>;
  swaps?: Array<{ from: string; to: string; why: string }>;
  treatMeal?: { name: string; why: string; calories: number };
  hydration?: { litersPerDay: number; tip: string };
  groceryList?: string[];
  foodsToAdd: string[];
  foodsToLimit: string[];
  weeklyChallenge?: string;
  funFact?: string;
  coachNote: string;
};

const SCAN_KEY = "glint.bodyscan.v1";

export function loadSavedScan(): BodyScanResult | null {
  try {
    const raw = localStorage.getItem(SCAN_KEY);
    return raw ? (JSON.parse(raw) as BodyScanResult) : null;
  } catch {
    return null;
  }
}

export function BodyScan({
  goal,
  onClose,
  onResult,
  onLogMeal,
}: {
  goal: string;
  onClose: () => void;
  onResult?: (r: BodyScanResult) => void;
  onLogMeal?: (m: PlanMeal) => void;
}) {

  const [image, setImage] = useState<string | null>(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sex, setSex] = useState("prefer not to say");
  const [activity, setActivity] = useState("moderately active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BodyScanResult | null>(null);
  const [day, setDay] = useState(0);
  const [logged, setLogged] = useState<string | null>(null);


  function readFile(f: File) {
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(f);
  }

  async function run() {
    if (!age || !weight) {
      setError("Age and weight are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/physique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          age: Number(age),
          weightKg: Number(weight),
          heightCm: height ? Number(height) : undefined,
          sex,
          activity,
          goal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");
      setResult(data as BodyScanResult);
      try { localStorage.setItem(SCAN_KEY, JSON.stringify(data)); } catch {}
      onResult?.(data as BodyScanResult);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card border-t border-border rounded-t-3xl p-5 pb-10 shadow-card max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Body Scan
            </h3>
            <p className="text-sm text-muted-foreground">
              Photo + your stats → body fat estimate, calorie target and a meal plan.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-lg border border-border flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {!result && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border overflow-hidden">
              {image ? (
                <div className="relative">
                  <img src={image} alt="Physique preview" className="w-full max-h-64 object-cover" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/60 text-white flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="p-5 grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => cameraRef.current?.click()}
                    className="rounded-xl bg-muted/50 border border-border py-5 flex flex-col items-center gap-1.5 text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <Camera className="h-5 w-5 text-primary" /> Take photo
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-xl bg-muted/50 border border-border py-5 flex flex-col items-center gap-1.5 text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <Plus className="h-5 w-5 text-primary" /> Upload
                  </button>
                  <p className="col-span-2 text-[11px] text-muted-foreground text-center">
                    Front-facing, good lighting works best. Photo is optional.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Age" value={age} onChange={setAge} placeholder="17" />
              <Field label="Weight (kg)" value={weight} onChange={setWeight} placeholder="68" />
              <Field label="Height (cm)" value={height} onChange={setHeight} placeholder="175" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Sex</span>
                <select value={sex} onChange={(e) => setSex(e.target.value)}
                  className="mt-1 w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium">
                  <option>male</option>
                  <option>female</option>
                  <option>prefer not to say</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Activity</span>
                <select value={activity} onChange={(e) => setActivity(e.target.value)}
                  className="mt-1 w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium">
                  <option>sedentary</option>
                  <option>lightly active</option>
                  <option>moderately active</option>
                  <option>very active</option>
                  <option>athlete</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl bg-muted/40 border border-border px-3 py-2 text-xs text-muted-foreground">
              Goal used for your plan: <span className="font-semibold text-foreground">{goal}</span>
            </div>

            {error && (
              <p className="text-sm font-semibold text-destructive bg-destructive/10 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              onClick={run}
              disabled={loading}
              className="w-full bg-gradient-mint text-primary-foreground font-bold py-4 rounded-2xl shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Scanning…</> : <>Scan my physique</>}
            </button>

            <p className="text-[11px] leading-relaxed text-muted-foreground text-center">
              AI estimates only — not a medical body-composition measurement or dietary advice. Photos are sent
              to an AI service for analysis and are never sold.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-card border border-border p-5">
              {result.physiqueTitle && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-mint/15 border border-primary/30 px-3 py-1 text-xs font-bold mb-3">
                  <span>{result.physiqueEmoji || "✨"}</span> {result.physiqueTitle}
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="font-display font-extrabold text-5xl leading-none">{result.bodyFat}%</div>
                <div className="pb-1">
                  <div className="text-sm font-semibold">{result.category}</div>
                  <div className="text-xs text-muted-foreground">
                    range {result.bodyFatRange} · {result.confidence} confidence
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{result.physiqueSummary}</p>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <Stat label="Lean mass" value={`${result.leanMassKg} kg`} />
                <Stat label="Fat mass" value={`${result.fatMassKg} kg`} />
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4 text-primary" />
                <h4 className="font-display font-bold">Your calories</h4>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <Stat label="BMR" value={`${result.bmr}`} />
                <Stat label="Maintenance" value={`${result.tdee}`} />
                <Stat label="Target" value={`${result.targetCalories}`} highlight />
              </div>
              <p className="text-sm text-muted-foreground mt-3">{result.targetRationale}</p>
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <Stat label="Protein" value={`${result.macros?.protein}g`} />
                <Stat label="Carbs" value={`${result.macros?.carbs}g`} />
                <Stat label="Fat" value={`${result.macros?.fat}g`} />
              </div>
              <p className="text-xs text-muted-foreground mt-3">{result.timelineNote}</p>
            </div>

            <div className="rounded-2xl bg-card border border-border p-5">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell className="h-4 w-4 text-primary" />
                <h4 className="font-display font-bold">Your food week</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                A different cuisine every day — tap a meal to log it instantly.
              </p>

              {week.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                  {week.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setDay(i)}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold border transition-colors ${
                        i === day
                          ? "bg-gradient-mint text-primary-foreground border-transparent shadow-glow"
                          : "bg-muted/40 border-border text-muted-foreground"
                      }`}
                    >
                      <span className="mr-1">{d.emoji || "🍽️"}</span>
                      {(d.day || `Day ${i + 1}`).slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              {activeDay && (
                <div className="flex items-baseline justify-between gap-3 mt-1 mb-2">
                  <div className="text-sm font-semibold">
                    {activeDay.emoji} {activeDay.theme}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activeDay.totalCalories || dayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {dayMeals.map((m, i) => (
                  <div key={i} className="rounded-xl bg-muted/40 border border-border p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{m.meal}</div>
                      <div className="text-sm font-bold">{m.calories} kcal</div>
                    </div>
                    <div className="font-semibold text-sm mt-0.5">{m.name}</div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="text-[11px] text-muted-foreground">
                        P {m.protein}g · C {m.carbs}g · F {m.fat}g
                      </div>
                      {onLogMeal && (
                        <button
                          onClick={() => { onLogMeal(m); setLogged(`${day}-${i}`); }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold rounded-lg border border-primary/40 bg-gradient-mint/10 px-2 py-1"
                        >
                          {logged === `${day}-${i}` ? <><CheckCircle2 className="h-3 w-3" /> Logged</> : <><PlusCircle className="h-3 w-3" /> Log it</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!!result.swaps?.length && (
              <div className="rounded-2xl bg-card border border-border p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Repeat className="h-4 w-4 text-primary" />
                  <h4 className="font-display font-bold">Smart swaps</h4>
                </div>
                <div className="space-y-2">
                  {result.swaps.map((s, i) => (
                    <div key={i} className="rounded-xl bg-muted/40 border border-border p-3">
                      <div className="text-sm font-semibold">
                        <span className="text-muted-foreground line-through">{s.from}</span> → {s.to}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.why}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5">
              {result.treatMeal?.name && (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Cookie className="h-4 w-4 text-primary" />
                    <h4 className="font-display font-bold text-sm">Weekly treat — guilt free</h4>
                  </div>
                  <div className="text-sm font-semibold">{result.treatMeal.name} · {result.treatMeal.calories} kcal</div>
                  <p className="text-xs text-muted-foreground mt-1">{result.treatMeal.why}</p>
                </div>
              )}

              {result.hydration?.litersPerDay && (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4 text-primary" />
                    <h4 className="font-display font-bold text-sm">Hydration · {result.hydration.litersPerDay} L/day</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{result.hydration.tip}</p>
                </div>
              )}

              <ListCard icon={<ShoppingBasket className="h-4 w-4 text-primary" />} title="Grocery list for the week" items={result.groceryList} />
              <ListCard icon={<CheckCircle2 className="h-4 w-4 text-primary" />} title="Eat more of" items={result.foodsToAdd} />
              <ListCard icon={<AlertCircle className="h-4 w-4 text-primary" />} title="Cut back on" items={result.foodsToLimit} />
              <ListCard icon={<Target className="h-4 w-4 text-primary" />} title="Focus areas" items={result.focusAreas} />

              {result.weeklyChallenge && (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <h4 className="font-display font-bold text-sm">7-day challenge</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.weeklyChallenge}</p>
                </div>
              )}

              {result.funFact && (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <h4 className="font-display font-bold text-sm">Did you know?</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.funFact}</p>
                </div>
              )}
            </div>

            {result.coachNote && (
              <div className="rounded-2xl bg-gradient-mint/10 border border-primary/30 p-4 text-sm font-semibold">
                {result.coachNote}
              </div>
            )}


            <button
              onClick={() => { setResult(null); }}
              className="w-full border border-border rounded-2xl py-3 font-semibold text-sm"
            >
              Scan again
            </button>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-primary"
      />
    </label>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 ${highlight ? "border-primary/40 bg-gradient-mint/10" : "border-border bg-muted/40"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg leading-tight">{value}</div>
    </div>
  );
}

function ListCard({ icon, title, items }: { icon: React.ReactNode; title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="font-display font-bold text-sm">{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm text-muted-foreground">• {it}</li>
        ))}
      </ul>
    </div>
  );
}
