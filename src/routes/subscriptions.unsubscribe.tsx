import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { unsubscribe } from "@/api/endpoints";
import { ErrorState } from "@/components/states";
import { DeleteDataControl } from "@/components/subscription/DeleteDataControl";
import { noReferrerMeta, SubscriptionShell } from "@/components/subscription/SubscriptionShell";
import { TokenMissing, TokenRejected } from "@/components/subscription/TokenRejected";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { isTokenRejected, readToken } from "@/lib/subscription";

const t = strings.subscriptions;

export const Route = createFileRoute("/subscriptions/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: readToken(search["token"]) ?? undefined,
  }),
  head: () => ({
    meta: [{ title: `${t.unsubscribeTitle} — ${strings.app.name}` }, noReferrerMeta],
  }),
  component: UnsubscribePage,
});

/**
 * Needs a click (a mail scanner opening the link must not unsubscribe anyone).
 * One-click unsubscribing from the mail app itself goes straight to the API
 * (RFC 8058) and never reaches this page.
 */
function UnsubscribePage() {
  const { token } = Route.useSearch();
  const mutation = useMutation({ mutationFn: (tok: string) => unsubscribe(tok) });

  return (
    <SubscriptionShell title={t.unsubscribeTitle}>
      {!token && <TokenMissing />}
      {token && mutation.error && isTokenRejected(mutation.error) && <TokenRejected />}
      {token && mutation.isSuccess && (
        <div className="space-y-3">
          <div role="status" className={surface.card}>
            <h2 className={typography.sectionTitle}>{t.unsubscribedTitle}</h2>
            <p className={`${typography.body} ${surface.muted} mt-1`}>{t.unsubscribedBody}</p>
          </div>
          <DeleteDataControl token={token} />
        </div>
      )}
      {token && !mutation.isSuccess && !isTokenRejected(mutation.error) && (
        <div className="space-y-3">
          <p className={typography.body}>{t.unsubscribeBody}</p>
          {mutation.error && <ErrorState error={mutation.error} />}
          <button
            type="button"
            className={control.button}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(token)}
          >
            {mutation.isPending ? t.working : t.unsubscribeButton}
          </button>
          <DeleteDataControl token={token} />
        </div>
      )}
    </SubscriptionShell>
  );
}
