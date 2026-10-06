import { useEffect } from "react";
import { strings } from "@/i18n/strings";

/**
 * Puts a name from the data (a region, a station) in the tab title once it is known.
 * The route's own static title stays until then, and is what the server renders.
 */
export function useDocumentTitle(name: string | null | undefined, suffix?: string): void {
  useEffect(() => {
    if (!name) return;
    document.title = [name, suffix, strings.app.name].filter(Boolean).join(" — ");
  }, [name, suffix]);
}
