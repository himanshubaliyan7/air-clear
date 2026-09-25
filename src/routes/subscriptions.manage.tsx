import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { regionsQuery } from "@/api/queries";
import { manageSubscription, unsubscribe } from "@/api/endpoints";
import type { Pollutant, Region } from "@/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { DeleteDataControl } from "@/components/subscription/DeleteDataControl";
import { SelectionFields } from "@/components/subscription/SelectionFields";
import { SubscriptionShell } from "@/components/subscription/SubscriptionShell";
import { TokenMissing, TokenRejected } from "@/components/subscription/TokenRejected";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import {
  hasErrors,
  isTokenRejected,
  noReferrerMeta,
  readToken,
  validateSelection,
  type SelectionErrors,
} from "@/lib/subscription";

const t = strings.subscriptions;

export const Route = createFileRoute("/subscriptions/manage")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: readToken(search["token"]) ?? undefined,
  }),
  head: () => ({ meta: [{ title: `${t.manageTitle} — ${strings.app.name}` }, noReferrerMeta] }),
  component: ManagePage,
});

function ManagePage() {
  const { token } = Route.useSearch();
  const { data: regions, isPending, error, refetch } = useQuery(regionsQuery());

  return (
    <SubscriptionShell title={t.manageTitle}>
      {!token && <TokenMissing />}
      {token && isPending && <LoadingState />}
      {token && error && <ErrorState error={error} onRetry={() => void refetch()} />}
      {token && regions && regions.length === 0 && (
        <EmptyState title={strings.regions.noneTitle} body={strings.regions.noneBody} />
      )}
      {token && regions && regions.length > 0 && <ManageForm token={token} regions={regions} />}
    </SubscriptionShell>
  );
}

/**
 * The API never reveals a subscription's current selection (nothing but the
 * emailed token authorises anything, and no response carries personal data), so
 * the owner chooses their stations afresh here.
 */
function ManageForm({ token, regions }: { token: string; regions: Region[] }) {
  const [regionId, setRegionId] = useState(regions[0]!.id);
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [pollutants, setPollutants] = useState<string[]>(() => [...(regions[0]!.pollutants ?? [])]);
  const [errors, setErrors] = useState<SelectionErrors>({});
  const save = useMutation({ mutationFn: manageSubscription });
  const stop = useMutation({ mutationFn: () => unsubscribe(token) });

  if (isTokenRejected(save.error) || isTokenRejected(stop.error)) return <TokenRejected />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateSelection(stationIds, pollutants);
    setErrors(found);
    if (hasErrors(found)) return;
    save.mutate({ token, station_ids: stationIds, pollutants: pollutants as Pollutant[] });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <p className={typography.body}>{t.manageBody}</p>
        <SelectionFields
          regions={regions}
          regionId={regionId}
          onRegionChange={(id) => {
            setRegionId(id);
            setPollutants([...(regions.find((r) => r.id === id)?.pollutants ?? [])]);
          }}
          stationIds={stationIds}
          onStationIds={setStationIds}
          pollutants={pollutants}
          onPollutants={setPollutants}
          errors={errors}
        />
        {save.error && <ErrorState error={save.error} />}
        {save.isSuccess && (
          <p role="status" className={`${surface.card} ${typography.body}`}>
            {t.manageSaved}
          </p>
        )}
        <button type="submit" className={control.button} disabled={save.isPending}>
          {save.isPending ? t.working : t.manageSave}
        </button>
      </form>

      <section className="space-y-3" aria-labelledby="other-actions">
        <h2 id="other-actions" className={typography.sectionTitle}>
          {t.otherActionsTitle}
        </h2>
        {stop.isSuccess ? (
          <div role="status" className={surface.card}>
            <h3 className={typography.sectionTitle}>{t.unsubscribedTitle}</h3>
            <p className={`${typography.body} ${surface.muted} mt-1`}>{t.unsubscribedBody}</p>
          </div>
        ) : (
          <button
            type="button"
            className={control.button}
            disabled={stop.isPending}
            onClick={() => stop.mutate()}
          >
            {stop.isPending ? t.working : t.unsubscribeButton}
          </button>
        )}
        {stop.error && <ErrorState error={stop.error} />}
        <DeleteDataControl token={token} />
      </section>
    </div>
  );
}
