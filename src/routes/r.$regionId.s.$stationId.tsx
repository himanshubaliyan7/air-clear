import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Station layout: the overview (index) and forecast detail render inside. */
export const Route = createFileRoute("/r/$regionId/s/$stationId")({
  component: StationLayout,
});

function StationLayout() {
  return <Outlet />;
}
