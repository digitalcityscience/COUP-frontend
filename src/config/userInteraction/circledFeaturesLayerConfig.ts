import type { SourceAndLayerConfigs } from "@/models";

const circledFeaturesLayerConfig: SourceAndLayerConfigs = {
  layerConfigs: [
    {
      id: "featureCircles",
      type: "line",
      source: "featureCircles",
      paint: {
        "line-color": "#FEE351",
        "line-width": 3,
      },
      layout: {
        "line-join": "miter",
        "line-cap": "square",
      },
    },
  ],
  source: {
    id: "featureCircles",
    options: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    },
  },
};

export default circledFeaturesLayerConfig;
