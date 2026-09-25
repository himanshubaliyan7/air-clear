import { Link } from "@tanstack/react-router";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";

const t = strings.subscriptions;

/** Shown for a link whose token is expired, used, unknown or forged (API 400). */
export function TokenRejected() {
  return (
    <div role="alert" className={surface.card}>
      <h2 className={typography.sectionTitle}>{t.tokenRejectedTitle}</h2>
      <p className={`${typography.body} ${surface.muted} mt-1`}>{t.tokenRejectedBody}</p>
      <Link to="/subscribe" className={`${control.button} mt-3`}>
        {t.requestNewLink}
      </Link>
    </div>
  );
}

/** Shown when the page was opened without a usable ?token=. */
export function TokenMissing() {
  return (
    <div role="alert" className={surface.card}>
      <h2 className={typography.sectionTitle}>{t.tokenMissingTitle}</h2>
      <p className={`${typography.body} ${surface.muted} mt-1`}>{t.tokenMissingBody}</p>
    </div>
  );
}
