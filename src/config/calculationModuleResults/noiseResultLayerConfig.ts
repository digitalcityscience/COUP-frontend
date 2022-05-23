import type { SourceAndLayerConfigs } from "@/models";

const noiseResultLayerConfig: SourceAndLayerConfigs = {
  layerConfigs: [
    {
      id: "noise",
      type: "fill-extrusion",
      source: "noise",
      paint: {
        "fill-extrusion-height": 0.2,
        "fill-extrusion-base": 0.25,
        "fill-extrusion-opacity": 0.8,
        "fill-extrusion-color": [
          "match",
          ["get", "idiso"],
          0,
          "#B8D6D1",
          1,
          "#CEE4CC",
          2,
          "#E2F2BF",
          3,
          "#F3C683",
          4,
          "#E87E4D",
          5,
          "#CD463E",
          6,
          "#A11A4D",
          7,
          "#75085C",
          "black",
        ],
      },
    },
  ],
  source: {
    id: "noise",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default noiseResultLayerConfig;
