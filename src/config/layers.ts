import PerformanceInfosConfig from "@/config/performanceInfos.json";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis.json";
import LayerSubselectionConfig from "@/config/layerSubSelection.json";
import AmenitiesConfig from "@/config/amenities.json";
import BridgesConfig from "@/config/bridges.json";
import CircledFeatures from "@/config/circledFeatures.json";
import FocusAreasConfig from "@/config/focusAreas.json";
import Trees from "@/config/trees.json";
import Noise from "@/config/noise.json";
import WindResult from "@/config/windResult.json";
import SunExposure from "@/config/sunExposureResult.json";
import TrafficCounts from "@/config/trafficCounts.json";
import SpacesConfig from "@/config/spaces.json";
import {
  abmTripsLayerName,
  abmAggregationLayerName,
} from "@/store/deck-layers";
import type { SourceAndLayerConfig } from "@/models";


export const swLayerName = "stormwater";

const addedLayersIds = [
  LayerSubselectionConfig.layerConfig.id,
  WindResult.layerConfig.id,
  SunExposure.layerConfig.id,
  Noise.layerConfig.id,
  TrafficCounts.layerConfig.id,
  swLayerName,
  Trees.layerConfig.id,
  MultiLayerAnalysisConfig.layerConfig.id,
  PerformanceInfosConfig.layerConfig.id,
  CircledFeatures.layerConfig.id,
];

const bridgeLayerIds = BridgesConfig.layers.map((layer) => {
  return layer.id;
});

export function getLayerOrder() {
  let layerOrder = [
    FocusAreasConfig.layerConfig.id,
    SpacesConfig.layer.id,
    AmenitiesConfig.layerConfig.id,
  ];

  layerOrder = layerOrder.concat(bridgeLayerIds);
  layerOrder = layerOrder.concat([abmAggregationLayerName, abmTripsLayerName]);
  layerOrder = layerOrder.concat(buildingLayerIds);
  layerOrder = layerOrder.concat(addedLayersIds);

  console.log("layerOrder", layerOrder);

  return layerOrder;
}

export const landscapeLayerConfig: SourceAndLayerConfig = {
  "source":
  {
    "id": "spaces",
    "options": {
      "type": "geojson",
      "data": {}
    }
  },
  "layerConfig":
  {
    "id": "spaces",
    "type": "fill",
    "source": "spaces",
    "paint": {
      "fill-opacity": 0.65,
      "fill-color": [
        "match",
        [
          "get",
          "land_use_detailed_type"
        ],
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
        "#04070F"
      ]
    }
  }
}

export const buildingLayerConfigs: SourceAndLayerConfig[] = [
  {
    "source": {
      "id": "groundfloor",
      "options": {
        "type": "geojson",
        "data": {}
      }
    },
    "layerConfig": {
      "id": "groundfloor",
      "type": "fill-extrusion",
      "source": "groundfloor",
      "paint": {
        "fill-extrusion-height": 5,
        "fill-extrusion-color": ["match", ["get", "selected"], "inactive", "#f5f5f5", "active", ["match", ["get", "land_use_detailed_type"], "residential", "#FFD529", "commercialOffice", "#ab0124", "daycare", "#1380AB", "public", "#1380AB", "specialUse", "#1380AB", "#CDCDCD"], "#f5f5f5"],
        "fill-extrusion-opacity": 0.8
      }
    }
  },
  {
    "source": {
      "id": "upperfloor",
      "options": {
        "type": "geojson",
        "data": {}
      }
    },
    "layerConfig": {
      "id": "upperfloor",
      "type": "fill-extrusion",
      "source": "upperfloor",
      "paint": {
        "fill-extrusion-color": ["match", ["get", "selected"], "inactive", "#f5f5f5", "active", ["match", ["get", "land_use_detailed_type"], "residential", "#FFD529", "commercialOffice", "#ab0124", "industrial", "#ff75cf", "daycare", "#1380AB", "public", "#1380AB", "specialUse", "#1380AB", "#cdcdcd"], "#f5f5f5"],
        "fill-extrusion-height": ["to-number", ["get", "building_height"]],
        "fill-extrusion-base": 5,
        "fill-extrusion-opacity": 0.8
      }
    }
  },
  {
    "source": {
      "id": "rooftops",
      "options": {
        "type": "geojson",
        "data": {}
      }
    },
    "layerConfig": {
      "id": "rooftops",
      "type": "fill-extrusion",
      "source": "rooftops",
      "paint": {
        "fill-extrusion-color": ["match", ["get", "selected"], "inactive", "#f5f5f5", "active", ["match", ["get", "land_use_detailed_type"], "residential", "#FFD529", "commercialOffice", "#ab0124", "industrial", "#ff75cf", "daycare", "#1380AB", "public", "#1380AB", "specialUse", "#1380AB", "#cdcdcd"], "#f5f5f5"],
        "fill-extrusion-height": ["to-number", ["get", "additional_roof_height"]],
        "fill-extrusion-base": ["to-number", ["get", "building_height"]],
        "fill-extrusion-opacity": 0.8
      }
    }
  }
];

export const buildingLayerIds = buildingLayerConfigs.map((config) => {
  return config.layerConfig.id;
});

export const abmLayerIds = [
  ...buildingLayerIds,
  abmAggregationLayerName,
  abmTripsLayerName,
  AmenitiesConfig.layerConfig.id
];
