import type { LayerSpecification, Map as MapboxMap } from "maplibre-gl"; // TODO swap for maplibre
import CityPyOStore from "./store/cityPyO";
import type StormWater from "./store/stormwater";
import type Wind from "./store/wind";
import type Noise from "./store/noise";
import type AbmStore from "./store/abmStore";

export type { MapboxMap };
export type GeoJSON = Record<string, unknown>;

export interface StoreState {
  map: MapboxMap | null;
  appContext: AppContext | null;
  activeMenuComponent: ScenarioComponentName;
  allFeaturesHighlighted: boolean;
  showLegend: boolean;
  currentTime: number;
  accessToken: string;
  cityPyO: CityPyOStore | null;
  restrictedAccess: boolean;
  focusAreasGeoJson: GeoJSON | null;
  focusAreasShown: boolean; // TODO: use visible layers instead
  openModalsIds: string[];
  modalIndex: number;
  selectedObjectId: string | null;
  selectedMultiFeatures: any[];
  featureCircles: any[];
}

export interface ScenarioStoreState {
  // ABM dashboard charts
  updateAbmStatsChart: boolean;
  updateAmenityStatsChart: boolean;

  // layers
  multiLayerAnalysisMap: boolean;

  // UI
  lastClick: any[];
  showUi: boolean;
  allFeaturesHighlighted: boolean;
  selectedFocusAreas: [];
  resultLoadingStati: DataLoadingStati;

  // sun
  sunExposureGeoJson: null;

  // Stormwater
  rerenderSwGraph: boolean;
}

export type TimeSheetContext = "abm" | "stormwater" | null;

export type AppContext = "grasbrook" | "schb";

export type ScenarioComponentName =
  | "wind"
  | "sun"
  | "stormwater"
  | "noise"
  | "pedestrian"
  | "multiLayer";

export type ScenarioComponentNames = Record<
  ScenarioComponentName,
  ScenarioComponentName
>;

export type DataLoadingStati = Record<ScenarioComponentName | "map", boolean>;

export type AgentId = string;
export type CoordinatesAsString = string;

export type AgentsClusteredForHeatmap = Record<number, AgentId[]>;

// Lookup table for the agents index in the AbmSimulationResult
export type AgentNameToIndexTable = Record<string, number>;

/**
 * count of all agents active during these 5 min onwards from timestamp
 * keys are 300, 600, ..
 */
export interface DataForAbmTimeGraph {
  labels: string[];
  values: number[];
}

// TODO refactor: remove all property. it can just be a number?
// TODO only need count of agents during this 5min slot.
export interface AbmResponse {
  amenitiesGeoJSON: GeoJSON;
  simulationResult: ResultDataSingleAgent[];
}

export type AbmSimulationResult = ResultDataSingleAgent[];

export interface ResultDataSingleAgent {
  agent: AbmAgent;
  path: Coordinates[];
  timestamps: Timestamp[];
  trips: AgentTrip[];
}

export interface AbmAgent {
  id: AgentId; // e.g. "people_resident10",
  // unused properties
  agent_age: string; // e.g. "18-35",
  resident_or_visitor: "resident" | "visitor";
  source: string;
  // source:  e.g. "1.csv"  // hint for which GAMA simulation this agent is from...
}

export interface fiveMinuteAgentSummary {
  all: AgentId[];
}
export interface AgentsPerCoordinate {
  busyAgents: AgentId[];
  // coordinate as string eg. "10.34345,51.2343"
  values: Record<CoordinatesAsString, AgentId[]>;
}

export interface AgentTrip {
  destination: Coordinates;
  duration: number;
  lenght: number;
  origin: Coordinates;
  // path_indexes: Indexes in ResultDataSingleAgent.path (path taken in trip)
  path_indexes: [number, number];
  agent: AgentId;
}

export type AbmTimeRange = [number, number];
export type Coordinates = [number, number];
export type Timestamp = number;

export type AbmScenarioConfiguration =
  | AbmScenarioConfigGrasbrook
  | AbmScenarioConfigSCHB;

export interface AbmScenarioConfigSCHB {
  amenity_config: "current" | "future";
}

export interface AbmScenarioConfigGrasbrook {
  bridge_hafencity: boolean;
  underpass_veddel_north: boolean;
  roof_amenities: AbmAmenityOptions;
  blocks: AbmBlocksOptions;
  main_street_orientation: AbmMainStreetOptions;
}

export type AbmMainStreetOptions = "vertical" | "horizontal";
export type AbmBlocksOptions = "open" | "closed";
export type AbmAmenityOptions = "random" | "complementary";

export type StormWaterRoofType = "extensive" | "intensive";
export type StormWaterFlowPath = "blockToPark" | "blockToStreet";

export interface WindScenarioConfiguration {
  wind_speed: number;
  wind_direction: number;
}

export interface SavedWindScenarioConfiguration
  extends WindScenarioConfiguration {
  label: string;
}

export interface WindResult {
  geojson: GeoJSON;
}

export interface NoiseScenarioConfiguration {
  max_speed: number;
  traffic_quota: number;
}

export interface SavedNoiseScenarioConfiguration
  extends NoiseScenarioConfiguration {
  label: string;
}

export interface NoiseResult {
  geojson: GeoJSON;
}

export interface StormWaterScenarioConfiguration {
  returnPeriod: number;
  flowPath: StormWaterFlowPath;
  roofs: StormWaterRoofType;
}

export interface StormWaterResult {
  geojson: GeoJSON;
  rainData: number[];
}

export type ScenarioWithTimeSheets = "abm" | "stormwater";

export interface StoreStateWithModules extends StoreState {
  scenario: ScenarioStoreState;
  stormwater: StormWater;
  wind: Wind;
  noise: Noise;
  abm: AbmStore;
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

export interface CityPyOUser {
  authenticated: boolean;
  restricted?: boolean;
  context?: Record<string, unknown>;
}

export interface CityPyO {
  url: string;
  userid: string;
}

export interface CalculationTask {
  taskId: string;
}

export interface SourceAndLayerConfig {
  source: MapSource;
  layerConfig: LayerSpecification;
}

export interface MapSource {
  id: string;
  options: {
    type: "geojson" | string;
    data: Record<string | number, any>;
  };
}
