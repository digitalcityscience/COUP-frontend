import { DataLoadingStati } from "@/models";
import { bridges, roofAmenitiesOptions } from "@/store/abm";

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
  bridges: [bridges.bridge_hafencity],
  abmTrips: null,
  agentIndexes: null,
  abmObject: {},
  activeAbmSet: null, // for trips layer
  abmTimePaths: null, //  for heatmap
  abmSimpleTimes: null,
  abmWeightCount: null,
  abmStats: {},
  abmStatsMultiLayer: {},
  amenityStatsMultiLayer: {},
  updateAbmStatsChart: false,
  updateAmenityStatsChart: false,

  currentlyShownScenarioSettings: {}, // TODO is this ABM specific??
  resultOutdated: true, // in the beginning no results are shown. Trigger user to request results.
  moduleSettings: {
    bridge_hafencity: true,
    underpass_veddel_north: true,
    roof_amenities: roofAmenitiesOptions.random,
    blocks: "open",
    main_street_orientation: "vertical",
  },

  animationRunning: false, // TODO is this really abm specific or for all timeChart components??
  animationSpeed: 7, // // TODO is this really abm specific or for all timeChart components??
  heatMapData: [],
  heatMapAverage: [],

  abmTimeRange: [8, 23], // time filter for the heatmap

  // layers
  noiseMap: false,
  stormWater: false,
  windLayer: false,
  sunExposureLayer: false,
  multiLayerAnalysisMap: false,
  heatMap: false,
  heatMapVisible: true,

  // UI
  loop: false,
  setLoop: false,
  currentTimeStamp: 0,
  lastClick: [],
  showUi: true,
  allFeaturesHighlighted: false,
  selectedFocusAreas: [],

  // Amenities
  amenitiesGeoJson: null,
  amenityStats: {},

  // sun
  sunExposureGeoJson: null,

  // UI
  selectGraph: "abm",
  resultLoadingStati: initialResultLoadingStati,

  // Stormwater
  rainTime: 0,
  rerenderSwGraph: false,
  savedStormWaterScenarios: [],
};
