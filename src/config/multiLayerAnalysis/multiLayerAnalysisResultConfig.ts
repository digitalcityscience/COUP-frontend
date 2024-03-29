import type { MapSource, SourceAndLayerConfigs } from "@/models";
import { LayerSpecification } from "maplibre-gl";

const layerConfigs: LayerSpecification[] = [
  {
    id: "multiLayerAnalysis",
    type: "fill-extrusion",
    source: "multiLayerAnalysis",
    paint: {
      "fill-extrusion-height": 0.2,
      "fill-extrusion-base": 0.25,
      "fill-extrusion-opacity": 0.8,
      // @ts-ignore
      "fill-extrusion-color": {
        property: "meanScaledValue",
        stops: [
          [0, "#ffffcc"],
          [20, "#c7e9b4"],
          [40, "#7fcdbb"],
          [60, "#41b6c4"],
          [80, "#2c7fb8"],
          [100, "#253494"],
        ],
      },
    },
  },
];

const sourceConfig: MapSource = {
  id: "multiLayerAnalysis",
  options: {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  },
};

const multiLayerAnalysisResultConfig: SourceAndLayerConfigs = {
  source: sourceConfig,
  layerConfigs: layerConfigs,
};

export default multiLayerAnalysisResultConfig;
