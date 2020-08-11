import {designScenarios, filterOptions, roofAmenitiesOptions} from "@/store/abm";

export default {
  designScenario: designScenarios.bridge_1,
  isLoading: false,
  abmData: null,
  moduleSettings: {
    bridge_1: true,
    bridge_2: false,
    roof_amenities: roofAmenitiesOptions.random,
    blocks: "permeable",
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
  animationRunning: true,
  animationSpeed: 7,
}

