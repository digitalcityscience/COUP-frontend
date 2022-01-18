import PerformanceInfosConfig from "@/config/multiLayerAnalysis/performaceInfosConfig";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import LayerSubselectionConfig from "@/config/multiLayerAnalysis/subSelectionLayerConfig";
import AmenitiesConfig from "@/config/abmScenarioSupportLayers/amenitiesLayerConfig";
import BridgesConfig from "@/config/bridges.json";
import CircledFeatures from "@/config/userInteraction/circledFeaturesLayerConfig";
import FocusAreasConfig from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import NoiseResultLayerConfig from "@/config/calculationModuleResults/noiseResultLayerConfig";
import WindResultLayerConfig from "@/config/calculationModuleResults/windResultLayerConfig";
import SunExposureResultLayerConfig from "@/config/calculationModuleResults/sunExposureResultConfig";
import TrafficCounts from "@/config/calculationModuleResults/trafficCountsLayerConfig";
import {
  abmTripsLayerName,
  abmAggregationLayerName,
} from "@/store/deck-layers";
import buildingLayersConfigs from "@/config/urbanDesignLayers/buildingLayersConfigs";
import landscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";

export const swLayerName = "stormwater";

const addedLayersIds = [
  LayerSubselectionConfig.layerConfig.id,
  WindResultLayerConfig.layerConfig.id,
  SunExposureResultLayerConfig.layerConfig.id,
  NoiseResultLayerConfig.layerConfig.id,
  TrafficCounts.layerConfig.id,
  swLayerName,
  MultiLayerAnalysisConfig.layerConfig.id,
  PerformanceInfosConfig.layerConfig.id,
  CircledFeatures.layerConfig.id,
];

const bridgeLayerIds: string[] = BridgesConfig.layers.map((layer) => {
  return layer.id;
});

export function getLayerOrder(): string[] {
  let layerOrder = [
    FocusAreasConfig.layerConfig.id,
    landscapeLayerConfig.layerConfig.id,
    AmenitiesConfig.layerConfig.id,
  ];

  layerOrder = layerOrder.concat(bridgeLayerIds);
  layerOrder = layerOrder.concat([abmAggregationLayerName, abmTripsLayerName]);
  layerOrder = layerOrder.concat(buildingLayerIds);
  layerOrder = layerOrder.concat(addedLayersIds);

  console.log("layerOrder", layerOrder);

  return layerOrder;
}

export const landscapeLayerId: string = landscapeLayerConfig.layerConfig.id;
export const buildingLayerIds: string[] = buildingLayersConfigs.map(
  (config) => {
    return config.layerConfig.id;
  }
);

export const abmLayerIds: string[] = [
  ...buildingLayerIds,
  abmAggregationLayerName,
  abmTripsLayerName,
  AmenitiesConfig.layerConfig.id,
];
