/**
 * App-wide data credits from GET /attributions, shown exactly as returned.
 * If the list cannot be loaded the footer stays quiet; per-reading attribution on
 * current-reading screens is rendered separately and is unaffected.
 */
import { useQuery } from "@tanstack/react-query";
import { attributionsQuery } from "@/api/queries";
import { strings } from "@/i18n/strings";
import { shell, surface, typography } from "@/design/tokens";

export function AttributionsFooter() {
  const { data } = useQuery(attributionsQuery());
  if (!data || data.length === 0) return null;
  return (
    <footer
      aria-label={strings.attributions.label}
      className={`${shell.footer} space-y-3 ${typography.small} ${surface.muted}`}
    >
      <p>{strings.app.disclaimer}</p>
      <ul className="space-y-1">
        {data.map((item) => (
          <li key={item.id}>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" className="underline">
                {item.text}
              </a>
            ) : (
              item.text
            )}
          </li>
        ))}
      </ul>
    </footer>
  );
}
