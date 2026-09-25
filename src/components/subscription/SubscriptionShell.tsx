/**
 * Layout for the subscription pages. They are reached from email links that
 * carry no region, so they live outside the /r/$regionId layout but keep the
 * same header.
 */
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { strings } from "@/i18n/strings";
import { surface, typography } from "@/design/tokens";

export function SubscriptionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${surface.page} min-h-screen`}>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center p-4">
          <Link to="/" className={typography.sectionTitle}>
            {strings.app.name}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 p-4 sm:p-6">
        <h1 className={typography.pageTitle}>{title}</h1>
        {children}
      </main>
    </div>
  );
}

/**
 * Pages that read an emailed token from the URL must not leak it to other sites
 * through the Referer header (e.g. via the attribution links in the footer).
 */
export const noReferrerMeta = { name: "referrer", content: "no-referrer" } as const;
