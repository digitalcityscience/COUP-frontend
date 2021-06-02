import {bridges, filterOptions, roofAmenitiesOptions} from "@/store/abm";

export default {
  bridges: [bridges.bridge_hafencity],
  resultLoading: false,
  loader: true,
  loaderTxt: 'data is loading ... ',
  abmData: null,
  abmTrips: null,
  agentIndexes: null,
  clusteredAbmData: null,
  activeAbmSet: null,   // same as abmData
  abmObject:{},
  abmTimePaths:null,
  activeTimePaths:null,
  abmSimpleTimes:null,
  abmWeightCount:null,
  abmStats: {},
  abmStatsMultiLayer: {},
  amenityStats: {},
  amenityStatsMultiLayer: {},
  updateAbmStatsChart: false,
  updateAmenityStatsChart: false,
  filterActive: false,
  filterSettings: null,
  noiseResults: [],
  trafficCounts: null,
  noiseScenario:{
    traffic_percent: 1,
    max_speed: 50,
  },
  currentNoiseGeoJson: null,
  currentlyShownScenarioSettings: {},
  resultOutdated: true,  // in the beginning no results are shown. Trigger user to request results.
  moduleSettings: {
    bridge_hafencity: true,
    bridge_veddel: "horizontal",
    roof_amenities: roofAmenitiesOptions.random,
    blocks: "open",
    main_street_orientation: "vertical"
  },
  scenarioViewFilters: {
    agent_age: ['0-6', '7-17', '18-35', '36-60', '61-100'],  // all ages activated
    resident_or_visitor: filterOptions.any,
    modes: {
      bicycle: true,
      car: true,
      foot: true,
      public_transport: true
    }
  },
  loop:false,
  setLoop:false,
  currentTimeStamp: 0,
  animationRunning: false,
  animationSpeed: 7,
  heatMapData:[],
  heatMapAverage: [],
  heatMapType:'default',
  heatMap:false,
  heatMapVisible:true,
  selectedRange:[8,23],
  noiseMap: false,
  stormWater: false,
  windLayer: false,
  sunExposureLayer: false,
  multiLayerAnalysisMap: false,
  lastClick: [],
  showUi: true,
  allFeaturesHighlighted: false,
  amenitiesGeoJson: null,
  selectedFocusAreas: [],
  windScenarioHash: '158d2b824886d908440da5c5f6c4dc4f815cdeba',  // hash for annual average setting
  currentWindScenario: {
    "wind_speed": 5,
    "wind_direction": 270
  },  // only gets used to create a description string in "Combine Layers" menu so far.
  savedWindScenarios: [
    {
      "wind_speed": 5,
      "wind_direction": 270,
      "label": "ANNUAL AVERAGE"
    },
    {
      "wind_speed": 25,
      "wind_direction": 270,
      "label": "LIGHT BREEZE"
    },
    {
      "wind_speed": 45,
      "wind_direction": 270,
      "label": "STRONG BREEZE"
    }
  ],
  savedNoiseScenarios: [],
  windResultGeoJson: null,
  sunExposureGeoJson: null,
  junctions:{},
  selectGraph: 'abm',
  swData: {},
  rainAmount: [],
  rainTime:0,
}

