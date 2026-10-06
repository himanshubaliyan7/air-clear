import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { regionsQuery, subscriptionAvailabilityQuery } from "@/api/queries";
import { requestSubscription } from "@/api/endpoints";
import type { Pollutant } from "@/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { SelectionFields } from "@/components/subscription/SelectionFields";
import { SubscriptionShell } from "@/components/subscription/SubscriptionShell";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { hasErrors, validateSelection, type SelectionErrors } from "@/lib/subscription";

const t = strings.subscriptions;

interface SubscribeSearch {
  region?: string | undefined;
}

export const Route = createFileRoute("/subscribe")({
  validateSearch: (search: Record<string, unknown>): SubscribeSearch =>
    typeof search["region"] === "string" && search["region"] !== ""
      ? { region: search["region"] }
      : {},
  head: () => ({
    meta: [
      { title: `${t.subscribeTitle} — ${strings.app.name}` },
      { name: "description", content: t.subscribeIntro },
    ],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const { region: requested } = Route.useSearch();
  const { data: regions, isPending, error, refetch } = useQuery(regionsQuery());
  // If this fails the notice is simply not shown: the server enforces the invite list either way.
  const { data: availability } = useQuery(subscriptionAvailabilityQuery());

  return (
    <SubscriptionShell title={t.subscribeTitle}>
      <p className={typography.body}>{t.subscribeIntro}</p>
      {availability && !availability.open && (
        <section
          role="note"
          aria-labelledby="demo-title"
          className="border border-foreground/40 bg-muted p-3"
        >
          <h2 id="demo-title" className={typography.sectionTitle}>
            {t.demoTitle}
          </h2>
          {/* The API's own wording, so the notice always matches the server setting. */}
          <p className={`${typography.small} ${surface.muted} mt-1`}>{availability.message}</p>
        </section>
      )}
      {isPending && <LoadingState />}
      {error && <ErrorState error={error} onRetry={() => void refetch()} />}
      {regions && regions.length === 0 && (
        <EmptyState title={strings.regions.noneTitle} body={strings.regions.noneBody} />
      )}
      {regions && regions.length > 0 && (
        <SubscribeForm
          regions={regions}
          initialRegionId={regions.find((r) => r.id === requested)?.id ?? regions[0]!.id}
        />
      )}
    </SubscriptionShell>
  );
}

function SubscribeForm({
  regions,
  initialRegionId,
}: {
  regions: Parameters<typeof SelectionFields>[0]["regions"];
  initialRegionId: string;
}) {
  const [regionId, setRegionId] = useState(initialRegionId);
  const region = regions.find((r) => r.id === regionId)!;
  const [email, setEmail] = useState("");
  const [stationIds, setStationIds] = useState<string[]>([]);
  const [pollutants, setPollutants] = useState<string[]>(() => [...(region.pollutants ?? [])]);
  const [errors, setErrors] = useState<SelectionErrors>({});
  const mutation = useMutation({ mutationFn: requestSubscription });

  const changeRegion = (id: string) => {
    setRegionId(id);
    setPollutants([...(regions.find((r) => r.id === id)?.pollutants ?? [])]);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateSelection(stationIds, pollutants);
    setErrors(found);
    if (hasErrors(found)) return;
    mutation.mutate({
      email,
      station_ids: stationIds,
      // Ids come from the region's own list; the API rejects anything else (422).
      pollutants: pollutants as Pollutant[],
    });
  };

  if (mutation.isSuccess) {
    return (
      <div role="status" className={surface.card}>
        <h2 className={typography.sectionTitle}>{t.checkEmailTitle}</h2>
        {/* The API's own wording: identical whatever state the address was in. */}
        <p className={`${typography.body} ${surface.muted} mt-1`}>{mutation.data.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <label className="block">
        <span className={`${typography.body} mb-1 block`}>{t.emailLabel}</span>
        <input
          type="email"
          required
          autoComplete="email"
          className={control.input}
          value={email}
          aria-describedby="email-hint"
          onChange={(event) => setEmail(event.target.value)}
        />
        <span id="email-hint" className={`${typography.small} ${surface.muted} mt-1 block`}>
          {t.emailHint}
        </span>
      </label>

      <SelectionFields
        regions={regions}
        regionId={regionId}
        onRegionChange={changeRegion}
        stationIds={stationIds}
        onStationIds={setStationIds}
        pollutants={pollutants}
        onPollutants={setPollutants}
        errors={errors}
      />

      <section className={`${surface.card} space-y-1`} aria-labelledby="privacy-title">
        <h2 id="privacy-title" className={typography.sectionTitle}>
          {t.privacyTitle}
        </h2>
        <p className={`${typography.small} ${surface.muted}`}>{t.privacyBody}</p>
      </section>

      {mutation.error && <ErrorState error={mutation.error} />}

      <button type="submit" className={control.button} disabled={mutation.isPending}>
        {mutation.isPending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
