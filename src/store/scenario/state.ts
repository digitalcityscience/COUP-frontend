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
  // ABM dashboard charts
  updateAbmStatsChart: false,
  updateAmenityStatsChart: false,

  // layers
  noiseMap: false,
  stormWater: false,
  windLayer: false,
  sunExposureLayer: false,
  multiLayerAnalysisMap: false,
  heatMap: false,
  
  // UI
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
