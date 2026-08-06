import { useEffect } from "react";
import { Languages } from "lucide-react";
import { LANGUAGES, useI18n, type Lang } from "@/lib/i18n";
import { useAtlas } from "@/lib/atlas-store";

export function LanguageSwitcher() {
  const lang = useI18n((s) => s.lang);
  const setLang = useI18n((s) => s.setLang);
  const hydrate = useI18n((s) => s.hydrate);

  // Restore the saved language after mount so SSR markup and hydration match.
  useEffect(() => {
    const stored = useI18n.getState().lang;
    hydrate();
    if (useI18n.getState().lang !== stored && useAtlas.getState().phase === "idle") {
      useAtlas.getState().reset();
    }
  }, [hydrate]);

  return (
    <label className="flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-3 py-2 text-xs text-muted-foreground">
      <Languages className="size-4 text-gold" />
      <select
        value={lang}
        onChange={(e) => {
          setLang(e.target.value as Lang);
          if (useAtlas.getState().phase === "idle") useAtlas.getState().reset();
        }}
        className="bg-transparent text-xs font-medium text-foreground outline-none"
        aria-label="Language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="bg-background text-foreground">
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
