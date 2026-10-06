/**
 * The strip along the foot of the window on region screens: that the data is
 * live, how old it is and how many stations are reporting. It repeats what the
 * overview already holds, so it adds no request and stays quiet until that arrives.
 */
import { useQuery } from "@tanstack/react-query";
import { overviewQuery } from "@/api/queries";
import { useRegion } from "@/region/region-context";
import { strings } from "@/i18n/strings";
import { shell } from "@/design/tokens";

export function StatusStrip({ regionId }: { regionId: string }) {
  const { formatAsOf, aqiStandard } = useRegion();
  const { data } = useQuery(overviewQuery(regionId));
  if (!data) return null;
  const reporting = data.stations.filter((station) => station.current_aqi.is_current).length;
  return (
    <div className={shell.status} role="status">
      <span>
        <span className={shell.liveDot} aria-hidden="true" />
        <span className={shell.statusValue}>{strings.instrument.statusLive}</span>
      </span>
      <span>{strings.instrument.statusData(formatAsOf(data.generated_at))}</span>
      <span className="max-md:hidden">
        {strings.instrument.statusReporting}{" "}
        <span className={shell.statusValue}>
          {strings.instrument.statusOf(reporting, data.stations.length)}
        </span>
      </span>
      <span className="ml-auto max-lg:hidden">{aqiStandard}</span>
    </div>
  );
}
