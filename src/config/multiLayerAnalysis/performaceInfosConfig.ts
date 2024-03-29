import type { SourceAndLayerConfigs } from "@/models";

const config: SourceAndLayerConfigs = {
  layerConfigs: [
    {
      id: "performanceInfos",
      type: "symbol",
      source: "performanceInfos",
      minzoom: 14.5,
      layout: {
        "icon-image": "mdi-information",
        "text-field": ["get", "shortInfoText"],
        "icon-allow-overlap": false,
        "icon-offset": [0, -5],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 11,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.05,
        "text-offset": [1, 3],
      },
      paint: {
        "text-color": "rgba(232, 232, 232, 1)",
        "text-halo-color": "rgba(46, 49, 49, 1)",
        "text-halo-width": 5,
      },
    },
  ],
  source: {
    id: "performanceInfos",
    options: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    },
  },
};

export default config;
