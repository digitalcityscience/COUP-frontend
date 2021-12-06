import type { Map as MapboxMap } from "mapbox-gl";
import CityPyO from "./store/cityPyO";
import type StormWater from "./store/stormwater";

export type { MapboxMap };

export interface VisibleLayers {
  focusAreas: boolean;
  abm: boolean;
  heat: boolean;
  amenities: boolean;
  noise: boolean;
  stormwater: boolean;
  wind: boolean;
  sunExposure: boolean;
  multiLayerAnalysis: boolean;
  trees: boolean;
}

export interface View {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface StoreState {
  map: MapboxMap | null;
  activeMenuComponent: string;
  layerIds: string[];
  allFeaturesHighlighted: boolean;
  showLegend: boolean;
  currentTime: number;
  view: View;
  accessToken: string;
  cityPyO: CityPyO | null;
  mapStyle: string;
  restrictedAccess: boolean;
  focusAreasGeoJson: Record<string, unknown> | null;
  focusAreasShown: boolean; // TODO: use visible layers instead
  openModalsIds: string[];
  modalIndex: number;
  selectedObjectId: string | null;
  selectedMultiFeatures: any[];
  featureCircles: any[];
  visibleLayers: VisibleLayers;
}

export interface ScenarioStoreState {
  showUi: boolean;
  activeAbmSet: unknown;
  animationRunning: boolean;
  abmTimePaths: unknown;
  abmTimeRange: [number, number];
  heatMap: boolean;
  rerenderSwGraph: boolean;
  stormWater: boolean;
  loop: boolean;
  abmSimpleTimes: Record<any, any>;
  currentTimeStamp: number;
  swResultGeoJson: Record<any, any>;
  selectGraph: ScenarioWithTimeSheets;
  rainAmount: number[];
  stormWaterScenarioConfiguration: StormWaterScenarioConfiguration;
  resultLoading: boolean;
}

export type StormWaterRoofType = "extensive" | "intensive";

export type StormWaterFlowPath = "blockToPark" | "blockToStreet";

export interface StormWaterScenarioConfiguration {
  returnPeriod: number;
  flowPath: StormWaterFlowPath;
  roofs: StormWaterRoofType;
}

export type ScenarioWithTimeSheets = "abm" | "sw";

export interface StoreStateWithModules extends StoreState {
  scenario: ScenarioStoreState;
  stormwater: StormWater;
}

export interface Legend {
  headline: string;
  icon: string;
  labelLowValues: string;
  labelHighValues: string;
  categories: Categories[];
}

export interface Categories {
  label: string;
  detail: string;
  color: string;
}

export interface MenuLink {
  title: string;
  icon: string;
  hidden?: boolean;
  default?: boolean;
}
