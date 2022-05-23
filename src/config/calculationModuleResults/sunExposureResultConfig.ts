import type { SourceAndLayerConfigs } from "@/models";

const sunExposureResultConfig: SourceAndLayerConfigs = {
  layerConfigs: [{
    id: "sun_exposure",
    type: "fill-extrusion",
    source: "sun_exposure",
    paint: {
      "fill-extrusion-height": 0.2,
      "fill-extrusion-base": 0.25,
      "fill-extrusion-opacity": 0.8,
      "fill-extrusion-color": [
        "match",

        ["*", ["get", "value"], 10],
        0,
        "#0571b0",
        1,
        "#6aaed1",
        2,
        "#b2d5e6",
        3,
        "#e7eff3",
        4,
        "#f7ece7",
        5,
        "#f6dbcf",
        6,
        "#f6cbb7",
        7,
        "#f5baa0",
        8,
        "#f5a988",
        9,
        "#e97867",
        10,
        "#da3c43",
        "black",
      ],
    },
  }],
  source: {
    id: "sun_exposure",
    options: {
      type: "geojson",
      data: {},
    },
  },
};

export default sunExposureResultConfig;
