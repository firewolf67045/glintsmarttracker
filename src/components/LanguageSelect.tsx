import { Languages } from "lucide-react";
import { languages, type Language } from "@/lib/i18n";

export function LanguageSelect({ value, onChange, compact = false }: { value: Language; onChange: (value: Language) => void; compact?: boolean }) {
  return (
    <label className="relative inline-flex items-center">
      <Languages className="pointer-events-none absolute left-2.5 h-4 w-4 text-primary" />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Language)}
        aria-label="Language"
        className={`appearance-none rounded-lg border border-border bg-card text-foreground outline-none transition focus:border-primary ${compact ? "h-9 w-10 pl-9 pr-0 text-transparent" : "h-10 pl-9 pr-8 text-xs font-semibold"}`}
      >
        {languages.map((language) => <option key={language.id} value={language.id}>{language.flag} {language.label}</option>)}
      </select>
    </label>
  );
}
