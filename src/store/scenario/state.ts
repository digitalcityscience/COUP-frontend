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
  updateAbmStatsChart: false,
  updateAmenityStatsChart: false,

  animationSpeed: 7, // todo remove from store, sw and abm

  // layers
  noiseMap: false,
  stormWater: false,
  windLayer: false,
  sunExposureLayer: false,
  multiLayerAnalysisMap: false,
  heatMap: false,
  
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
