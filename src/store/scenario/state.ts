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

  // TODO make a getter!
  multiLayerAnalysisMap: false,

  // UI
  lastClick: [],
  showUi: true,
  selectedFocusAreas: [],
  resultLoadingStati: initialResultLoadingStati,

  // sun
  sunExposureGeoJson: null,

  // Stormwater
  rerenderSwGraph: false,
};
