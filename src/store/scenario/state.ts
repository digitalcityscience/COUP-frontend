import { bridges, roofAmenitiesOptions } from "@/store/abm";

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
  resultLoading: false,
  loader: true,
  loaderTxt: "data is loading ... ",

  // Amenities
  amenitiesGeoJson: null,
  amenityStats: {},

  // wind
  windScenarioHash: "158d2b824886d908440da5c5f6c4dc4f815cdeba", // hash for annual average setting // TODO DELETE?
  currentWindScenario: {
    wind_speed: 5,
    wind_direction: 270,
  }, // only gets used to create a description string in "Combine Layers" menu so far.
  savedWindScenarios: [
    {
      wind_speed: 5,
      wind_direction: 270,
      label: "ANNUAL AVERAGE",
    },
    {
      wind_speed: 25,
      wind_direction: 270,
      label: "LIGHT BREEZE",
    },
    {
      wind_speed: 45,
      wind_direction: 270,
      label: "STRONG BREEZE",
    },
  ],
  windResultGeoJson: null,

  // sun
  sunExposureGeoJson: null,

  // noise
  savedNoiseScenarios: [],
  noiseScenario: {
    traffic_quota: 1,
    max_speed: 50,
  },
  noiseResults: [],
  currentNoiseGeoJson: null,
  trafficCounts: null,

  // UI
  selectGraph: "abm",

  // Stormwater
  junctions: {},
  swResultGeoJson: {},
  rainAmount: [],
  rainTime: 0,
  rerenderSwGraph: false,
  savedStormWaterScenarios: [],
  stormWaterScenarioConfiguration: null,
};
