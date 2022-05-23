import type { MapSource, SourceAndLayerConfigs } from "@/models";
import { FillLayerSpecification } from "maplibre-gl";

const sourceConfig: MapSource = {
  id: "spaces",
  options: {
    type: "geojson",
    data: {},
  },
};

const layerConfigs: FillLayerSpecification[] = [{
  id: "spaces",
  type: "fill",
  source: "spaces",
  paint: {
    "fill-opacity": 0.65,
    "fill-color": [
      "match",
      ["get", "land_use_detailed_type"],
      "promenade",
      "#0D1118",
      "street",
      "#3e4141",
      "bridge",
      "#3e4141",
      "park",
      "#131714",
      "plaza",
      "#0D1118",
      "#04070F",
    ],
  },
}];

const landscapeLayerConfig: SourceAndLayerConfigs = {
  source: sourceConfig,
  layerConfigs: layerConfigs,
};

export default landscapeLayerConfig;
