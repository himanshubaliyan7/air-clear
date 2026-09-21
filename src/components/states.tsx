/**
 * Shared loading / empty / error states. No screen renders a blank page or a raw
 * error payload; every failure lands on one of these.
 */
import type { ReactNode } from "react";
import { ApiError, API_BASE_URL_ENV_NAME } from "@/api/client";
import { strings } from "@/i18n/strings";
import { control, surface, typography } from "@/design/tokens";

export function LoadingState({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${surface.card} ${typography.body}`}
    >
      <span>{label ?? strings.common.loading}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  children,
}: {
  title?: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className={surface.card}>
      <h2 className={typography.sectionTitle}>
        {title ?? strings.states.emptyTitle}
      </h2>
      <p className={`${typography.body} ${surface.muted} mt-1`}>
        {body ?? strings.states.emptyBody}
      </p>
      {children}
    </div>
  );
}

interface ErrorCopy {
  title: string;
  body: string;
  fields: [string, string][];
}

export function describeError(error: unknown): ErrorCopy {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "not-found":
        return {
          title: strings.states.notFoundTitle,
          body: strings.states.notFoundBody,
          fields: [],
        };
      case "validation":
        return {
          title: strings.states.validationTitle,
          body: error.message,
          fields: Object.entries(error.fieldErrors),
        };
      case "network":
        return {
          title: strings.states.networkTitle,
          body: strings.states.networkBody,
          fields: [],
        };
      case "insecure":
        return {
          title: strings.states.insecureTitle,
          body: strings.states.insecureBody,
          fields: [],
        };
      case "not-configured":
        return {
          title: strings.states.notConfiguredTitle,
          body: `${strings.states.notConfiguredBody} (${API_BASE_URL_ENV_NAME})`,
          fields: [],
        };
      case "server":
      default:
        return {
          title: strings.states.serverTitle,
          body: strings.states.serverBody,
          fields: [],
        };
    }
  }
  return {
    title: strings.states.errorTitle,
    body: strings.states.serverBody,
    fields: [],
  };
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const copy = describeError(error);
  return (
    <div role="alert" className={surface.card}>
      <h2 className={typography.sectionTitle}>{copy.title}</h2>
      <p className={`${typography.body} ${surface.muted} mt-1`}>{copy.body}</p>
      {copy.fields.length > 0 && (
        <ul className={`${typography.body} mt-2 list-disc pl-5`}>
          {copy.fields.map(([field, message]) => (
            <li key={field}>
              <strong>{field}</strong>: {message}
            </li>
          ))}
        </ul>
      )}
      {onRetry && (
        <button type="button" className={`${control.button} mt-3`} onClick={onRetry}>
          {strings.common.retry}
        </button>
      )}
    </div>
  );
}
