/**
 * States whether a kind of data exists for a station, in words, in both directions.
 *
 * Deliberately neutral: no colour carries meaning, no tick, no thumbs-up, nothing
 * green. Availability is not a statement about whether the air is safe.
 */
import { typography } from "@/design/tokens";

export function AvailabilityMarker({
  available,
  availableText,
  unavailableText,
}: {
  available: boolean;
  availableText: string;
  unavailableText: string;
}) {
  return (
    <span
      className={`${typography.small} inline-flex items-center rounded-md border border-border bg-muted px-2 py-1 text-muted-foreground`}
    >
      {available ? availableText : unavailableText}
    </span>
  );
}
