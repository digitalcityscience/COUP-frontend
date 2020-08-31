import {bridges, filterOptions, roofAmenitiesOptions} from "@/store/abm";

export default {
  bridges: [bridges.bridge_hafencity],
  isLoading: false,
  abmData: null,
  abmObject:{},
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
    student_or_adult: filterOptions.any,
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
}

