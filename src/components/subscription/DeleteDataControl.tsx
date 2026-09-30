/**
 * "Delete my data", with an explicit second step: it is irreversible.
 */
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { deleteSubscription } from "@/api/endpoints";
import { ErrorState } from "@/components/states";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";
import { isTokenRejected } from "@/lib/subscription";
import { TokenRejected } from "./TokenRejected";

const t = strings.subscriptions;

export function DeleteDataControl({ token }: { token: string }) {
  const [asking, setAsking] = useState(false);
  const mutation = useMutation({ mutationFn: () => deleteSubscription(token) });

  if (mutation.isSuccess) {
    return (
      <div role="status" className={surface.card}>
        <h2 className={typography.sectionTitle}>{t.deletedTitle}</h2>
        <p className={`${typography.body} ${surface.muted} mt-1`}>{t.deletedBody}</p>
      </div>
    );
  }
  if (mutation.error && isTokenRejected(mutation.error)) return <TokenRejected />;

  return (
    <div className="space-y-2">
      {!asking ? (
        <button type="button" className={control.button} onClick={() => setAsking(true)}>
          {t.deleteButton}
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby="delete-prompt" className={surface.card}>
          <p id="delete-prompt" className={typography.body}>
            {t.deleteConfirmPrompt}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`${control.button} border-destructive text-destructive`}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? t.working : t.deleteConfirmButton}
            </button>
            <button type="button" className={control.button} onClick={() => setAsking(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
      {mutation.error && <ErrorState error={mutation.error} />}
    </div>
  );
}
