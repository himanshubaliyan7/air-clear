/**
 * The licence requires attribution wherever current readings are shown.
 * The text is rendered exactly as the API returns it, never edited or abbreviated.
 */
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

export function Attribution({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  return (
    <p className={`${typography.small} ${surface.muted}`}>
      <span className="sr-only">{strings.current.attributionLabel}: </span>
      {text}
    </p>
  );
}
