export const noiseSettingsNames = {
  max_speed: "max_speed",
  traffic_quota: "traffic_quota",
};
export const noiseLayerName = "noise";

export function getFormattedTrafficCounts(
  trafficCountsOriginalPlanning,
  trafficPercent
) {
  const formattedTrafficCounts = trafficCountsOriginalPlanning;
  formattedTrafficCounts.forEach((point) => {
    point["properties"]["car_traffic_daily"] =
      point["properties"]["car_traffic_daily"] * trafficPercent;
    point["properties"]["truck_traffic_daily"] =
      point["properties"]["truck_traffic_daily"] * trafficPercent;
  });

  return formattedTrafficCounts;
}
