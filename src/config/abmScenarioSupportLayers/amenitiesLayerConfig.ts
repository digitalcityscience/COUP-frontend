import type { SourceAndLayerConfig } from "@/models";

const amenitiesLayerConfig: SourceAndLayerConfig = {
  layerConfig: {
    id: "abmAmenities",
    type: "circle",
    source: "abmAmenities",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        10,
        0.6,
        15,
        2.4,
        25,
        12,
      ],
      "circle-opacity": 0.8,
      "circle-color": [
        "case",
        ["<=", ["get", "GFK"], 1024],
        "#ffb121",
        ["<=", ["get", "GFK"], 2100],
        "#f76a6a",
        ["<=", ["get", "GFK"], 2200],
        "#ff75cf",
        [">=", ["get", "GFK"], 3000],
        "#4ebffc",
        "lightgrey",
      ],
    },
  },
  source: {
    id: "abmAmenities",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default amenitiesLayerConfig;
