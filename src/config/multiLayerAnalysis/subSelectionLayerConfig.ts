import type { SourceAndLayerConfig } from "@/models";

const subSelectionLayerConfig: SourceAndLayerConfig = {
  layerConfig: {
    id: "layerSubSelection",
    type: "fill-extrusion",
    source: "layerSubSelection",
    paint: {
      "fill-extrusion-height": 0.2,
      "fill-extrusion-base": 0.25,
      "fill-extrusion-opacity": 0.8,
      // @ts-ignore
      "fill-extrusion-color": {
        property: "scaledValue",
        stops: [
          [0, "#f7f7f7"],
          [20, "#d9d9d9"],
          [40, "#bdbdbd"],
          [60, "#969696"],
          [80, "#636363"],
          [100, "#252525"],
        ],
      },
    },
  },
  source: {
    id: "layerSubSelection",
    options: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    },
  },
};

export default subSelectionLayerConfig;
