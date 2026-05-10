import { createFileRoute } from "@tanstack/react-router";
import heroBowl from "@/assets/hero-bowl.jpg";
import { Camera, Barcode, Sparkles, ScanLine, Flame, TrendingUp, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glint — AI Calorie Tracking, Effortlessly" },
      { name: "description", content: "Snap a photo. Glint's AI instantly counts calories, macros, and portions. Track your nutrition without the friction." },
      { property: "og:title", content: "Glint — AI Calorie Tracking" },
      { property: "og:description", content: "Snap a photo. Glint's AI instantly counts calories, macros, and portions." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-gradient-hero overflow-x-hidden">
      {/* Nav */}
      <header className="flex items-center justify-between px-5 pt-6 pb-2 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-mint shadow-glow flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">glint</span>
        </div>
        <a href="#download" className="text-sm font-semibold px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
          Get app
        </a>
      </header>

      {/* Hero */}
      <section className="px-5 pt-10 pb-16 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              AI nutrition, ridiculously simple
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5">
              Snap it.<br />
              <span className="text-gradient-mint">Track it.</span><br />
              Done.
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
              Point your camera at any meal. Glint's AI estimates calories, macros, and portions in under a second.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#download" className="px-6 py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-semibold text-center shadow-glow hover:scale-[1.02] transition-transform">
                Download Glint
              </a>
              <a href="#how" className="px-6 py-4 rounded-2xl bg-card border border-border font-semibold text-center hover:border-primary/40 transition">
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> No manual logging</div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 95% accuracy</div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-[320px] animate-float">
            <div className="absolute -inset-10 bg-gradient-mint opacity-20 blur-3xl rounded-full" />
            <div className="relative rounded-[2.5rem] bg-card border border-border p-3 shadow-card">
              <div className="rounded-[2rem] overflow-hidden bg-background relative">
                <img
                  src={heroBowl}
                  alt="Salmon and quinoa bowl analyzed by Glint AI"
                  width={1024}
                  height={1280}
                  className="w-full h-[480px] object-cover"
                />
                {/* AI overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full bg-background/70 backdrop-blur-md border border-border/50 text-xs font-medium">
                  <ScanLine className="h-3.5 w-3.5 text-primary" />
                  Analyzing meal…
                </div>
                {/* Result card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-background/85 backdrop-blur-xl border border-border shadow-card">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Salmon Bowl</div>
                      <div className="font-display font-bold text-2xl">
                        542 <span className="text-sm text-muted-foreground font-medium">kcal</span>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-mint flex items-center justify-center animate-pulse-glow">
                      <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MacroPill label="Carbs" value="48g" color="bg-[var(--carb)]" />
                    <MacroPill label="Protein" value="38g" color="bg-[var(--protein)]" />
                    <MacroPill label="Fat" value="22g" color="bg-[var(--fat)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="how" className="px-5 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">How it works</div>
          <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
            Three ways to log.<br />
            <span className="text-muted-foreground">Zero friction.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Camera className="h-6 w-6" />}
            title="Photo recognition"
            desc="Point and shoot. AI identifies ingredients, estimates portion size, and calculates macros instantly."
            tall
          />
          <FeatureCard
            icon={<Barcode className="h-6 w-6" />}
            title="Barcode scanning"
            desc="Scan packaged foods. Get exact nutrition from millions of products in our database."
          />
          <FeatureCard
            icon={<ScanLine className="h-6 w-6" />}
            title="Label OCR"
            desc="Snap any nutrition label. Glint reads it and logs everything for you, automatically."
          />
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 py-16 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-gradient-card border border-border p-8 sm:p-12 shadow-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat value="<1s" label="Analysis time" icon={<Flame className="h-5 w-5" />} />
            <Stat value="95%" label="Calorie accuracy" icon={<TrendingUp className="h-5 w-5" />} />
            <Stat value="2M+" label="Foods recognized" icon={<Sparkles className="h-5 w-5" />} />
            <Stat value="4.9★" label="App store rating" icon={<Check className="h-5 w-5" />} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="px-5 py-20 max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
          Your meals,<br /><span className="text-gradient-mint">decoded.</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          Stop guessing. Start tracking with the app that actually understands what's on your plate.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="px-8 py-4 rounded-2xl bg-gradient-mint text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition-transform">
            Download for iOS
          </button>
          <button className="px-8 py-4 rounded-2xl bg-card border border-border font-semibold hover:border-primary/40 transition">
            Get on Android
          </button>
        </div>
      </section>

      <footer className="px-5 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-gradient-mint" />
            <span className="font-display font-semibold text-foreground">glint</span>
          </div>
          <span>© 2026 Glint.org</span>
        </div>
      </footer>
    </main>
  );
}

function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-muted/40 px-2 py-2">
      <div className={`h-1 w-6 mx-auto rounded-full ${color} mb-1.5`} />
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, tall }: { icon: React.ReactNode; title: string; desc: string; tall?: boolean }) {
  return (
    <div className={`rounded-3xl bg-gradient-card border border-border p-7 shadow-card hover:border-primary/30 transition-all hover:-translate-y-1 ${tall ? "md:row-span-2 md:min-h-[280px]" : ""}`}>
      <div className="h-12 w-12 rounded-2xl bg-gradient-mint flex items-center justify-center text-primary-foreground mb-5 shadow-glow">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div>
      <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary mb-3">
        {icon}
      </div>
      <div className="font-display text-3xl sm:text-4xl font-bold text-gradient-mint">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
