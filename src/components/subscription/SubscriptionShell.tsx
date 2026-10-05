/**
 * Layout for the subscription pages. They are reached from email links that
 * carry no region, so they live outside the /r/$regionId layout but keep the
 * same header.
 */
import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { shell, typography } from "@/design/tokens";

export function SubscriptionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={shell.page}>
      <AppHeader />
      <main className={shell.mainNarrow}>
        <h1 className={typography.pageTitle}>{title}</h1>
        {children}
      </main>
    </div>
  );
}
