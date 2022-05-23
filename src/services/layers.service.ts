import PerformanceInfosConfig from "@/config/multiLayerAnalysis/performaceInfosConfig";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import LayerSubselectionConfig from "@/config/multiLayerAnalysis/subSelectionLayerConfig";
import AmenitiesConfig from "@/config/abmScenarioSupportLayers/amenitiesLayerConfig";
import CircledFeatures from "@/config/userInteraction/circledFeaturesLayerConfig";
import FocusAreasConfig from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import NoiseResultLayerConfig from "@/config/calculationModuleResults/noiseResultLayerConfig";
import WindResultLayerConfig from "@/config/calculationModuleResults/windResultLayerConfig";
import SunExposureResultLayerConfig from "@/config/calculationModuleResults/sunExposureResultConfig";
import TrafficCounts from "@/config/calculationModuleResults/trafficCountsLayerConfig";
import {
  abmTripsLayerName,
  abmAggregationLayerName,
} from "@/services/deck.service";
import {
  buildingLayersColored,
  buildingLayersNoColor,
} from "@/config/urbanDesignLayers/buildingLayersConfigs";
import landscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";
import {
  hafenCityBridgeLayerConf,
  veddelUnderPassConfig,
} from "@/config/abmScenarioSupportLayers/bridgeLayersConfigs";
import { LayerSpecification } from "maplibre-gl";

export const swLayerName = "stormwater";

const addedLayersIds = [
  ...getLayerIds(LayerSubselectionConfig.layerConfigs),
  ...getLayerIds(WindResultLayerConfig.layerConfigs),
  ...getLayerIds(SunExposureResultLayerConfig.layerConfigs),
  ...getLayerIds(NoiseResultLayerConfig.layerConfigs),
  ...getLayerIds(TrafficCounts.layerConfigs),
  swLayerName,
  ...getLayerIds(MultiLayerAnalysisConfig.layerConfigs),
  ...getLayerIds(PerformanceInfosConfig.layerConfigs),
  ...getLayerIds(CircledFeatures.layerConfigs),
];

const bridgeLayerIds: string[] = [
  hafenCityBridgeLayerConf.id,
  veddelUnderPassConfig.id,
];

export function getLayerOrder(): string[] {
  let layerOrder = [
    ...getLayerIds(FocusAreasConfig.layerConfigs),
    ...getLayerIds(landscapeLayerConfig.layerConfigs),
    ...getLayerIds(AmenitiesConfig.layerConfigs),
  ];

  layerOrder = layerOrder.concat(bridgeLayerIds);
  layerOrder = layerOrder.concat([abmAggregationLayerName, abmTripsLayerName]);
  layerOrder = layerOrder.concat(buildingLayerIds);
  layerOrder = layerOrder.concat(addedLayersIds);

  console.log("layerOrder", layerOrder);

  return layerOrder;
}

export const landscapeLayerIds: string[] = getLayerIds(
  landscapeLayerConfig.layerConfigs
);
export const buildingLayerIds: string[] = [
  ...buildingLayersNoColor,
  ...buildingLayersColored,
];

export function getLayerIds(layerConfigs: LayerSpecification[]) {
  return layerConfigs.map((conf) => {
    return conf.id;
  });
}
