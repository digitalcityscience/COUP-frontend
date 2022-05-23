import type { SourceAndLayerConfigs } from "@/models";

const trafficCountLayerConfig: SourceAndLayerConfigs = {
  layerConfigs: [{
    id: "trafficCounts",
    type: "symbol",
    source: "trafficCounts",
    minzoom: 15.5,
    layout: {
      "icon-image": "mdi-information",
      "text-field": ["get", "description"],
      "text-size": 14,
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [1, 1.25],
      "text-anchor": "top",
    },
  }],
  source: {
    id: "trafficCounts",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default trafficCountLayerConfig;
