import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { confirmSubscription } from "@/api/endpoints";
import { ErrorState } from "@/components/states";
import { noReferrerMeta, SubscriptionShell } from "@/components/subscription/SubscriptionShell";
import { TokenMissing, TokenRejected } from "@/components/subscription/TokenRejected";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { isTokenRejected, readToken } from "@/lib/subscription";

const t = strings.subscriptions;

export const Route = createFileRoute("/subscriptions/confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: readToken(search["token"]) ?? undefined,
  }),
  head: () => ({ meta: [{ title: `${t.confirmTitle} — ${strings.app.name}` }, noReferrerMeta] }),
  component: ConfirmPage,
});

/**
 * Confirmation needs a click, never happens on page load: mail scanners open links
 * automatically, and a scanner must not be able to subscribe an address.
 */
function ConfirmPage() {
  const { token } = Route.useSearch();
  const mutation = useMutation({ mutationFn: (tok: string) => confirmSubscription(tok) });

  return (
    <SubscriptionShell title={t.confirmTitle}>
      {!token && <TokenMissing />}
      {token && mutation.isSuccess && (
        <div role="status" className={surface.card}>
          <h2 className={typography.sectionTitle}>{t.confirmedTitle}</h2>
          <p className={`${typography.body} ${surface.muted} mt-1`}>{t.confirmedBody}</p>
          <Link to="/" className={`${control.button} mt-3`}>
            {strings.app.name}
          </Link>
        </div>
      )}
      {token && mutation.error && isTokenRejected(mutation.error) && <TokenRejected />}
      {token && !mutation.isSuccess && !isTokenRejected(mutation.error) && (
        <div className="space-y-3">
          <p className={typography.body}>{t.confirmBody}</p>
          {mutation.error && <ErrorState error={mutation.error} />}
          <button
            type="button"
            className={control.button}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(token)}
          >
            {mutation.isPending ? t.working : t.confirmButton}
          </button>
        </div>
      )}
    </SubscriptionShell>
  );
}
