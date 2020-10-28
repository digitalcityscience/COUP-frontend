import {bridges, filterOptions, roofAmenitiesOptions} from "@/store/abm";

export default {
  bridges: [bridges.bridge_hafencity],
  resultLoading: false,
  abmData: null,
  clusteredAbmData: null,
  activeAbmSet: null,
  abmObject:{},
  filterActive: false,
  filterSettings: null,
  noiseResults: [],
  trafficCounts: null,
  showNoise:false,
  noiseScenario:{
    traffic_percent: 0.5,
    max_speed: 50,
  },
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
  currentTimeStamp: 0,
  animationRunning: false,
  animationSpeed: 7,
  heatMapData:[],
  heatMapAverage: [],
  heatMapType:'average',
  heatMap:false,
  lastClick: [],
  showUi: true,
  modalIndex: 0,
  allFeaturesHighlighted: false,
}

