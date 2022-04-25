import { DataLoadingStati } from "@/models";

const initialResultLoadingStati: DataLoadingStati = {
  pedestrian: false,
  sun: false,
  wind: false,
  multiLayer: false,
  stormwater: false,
  noise: false,
  map: false,
};

export default {
  // ABM
  agentIndexes: null,
  activeAbmSet: null, // for trips layer
  abmTimePaths: null, //  for heatmap
  updateAbmStatsChart: false,
  updateAmenityStatsChart: false,

  animationSpeed: 7, // todo remove from store, sw and abm

  abmTimeRange: [8, 23], // time filter for the heatmap and timeSheet // TODO refactor

  // layers
  noiseMap: false,
  stormWater: false,
  windLayer: false,
  sunExposureLayer: false,
  multiLayerAnalysisMap: false,
  heatMap: false,
  heatMapVisible: true,

  // UI
  currentTimeStamp: null,
  lastClick: [],
  showUi: true,
  allFeaturesHighlighted: false,
  selectedFocusAreas: [],

  // sun
  sunExposureGeoJson: null,

  // UI
  resultLoadingStati: initialResultLoadingStati,

  // Stormwater
  rerenderSwGraph: false,
};
