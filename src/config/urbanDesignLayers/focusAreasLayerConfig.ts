import type { SourceAndLayerConfigs } from "@/models";

const focusAreasLayerConfig: SourceAndLayerConfigs = {
  layerConfigs: [
    {
      id: "focusAreas",
      type: "fill",
      source: "focusAreas",
      layout: { visibility: "none" },
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          ["get", "color"],
          ["boolean", ["feature-state", "clicked"], false],
          ["get", "color"],
          "lightgrey",
        ],
        "fill-outline-color": "black",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          0.5,
          ["boolean", ["feature-state", "clicked"], false],
          0.5,
          0.2,
        ],
      },
    },
  ],
  source: {
    id: "focusAreas",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default focusAreasLayerConfig;
