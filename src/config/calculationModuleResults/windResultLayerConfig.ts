import type { SourceAndLayerConfigs } from "@/models";

const windResultLayerConfig: SourceAndLayerConfigs = {
  layerConfigs: [
    {
      id: "wind",
      type: "fill-extrusion",
      source: "wind",
      paint: {
        "fill-extrusion-height": 0.2,
        "fill-extrusion-base": 0.25,
        "fill-extrusion-opacity": 0.8,
        "fill-extrusion-color": [
          "match",

          ["*", ["get", "value"], 10],
          0,
          "#458cbf",
          2,
          "#95d3e0",
          4,
          "#90c363",
          6,
          "#f4ec7d",
          8,
          "#fbc46f",
          10,
          "#ee7679",
          "black",
        ],
      },
    },
  ],
  source: {
    id: "wind",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default windResultLayerConfig;
