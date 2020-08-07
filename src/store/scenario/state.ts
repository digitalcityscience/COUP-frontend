import {designScenarios, filterOptions, roofAmenitiesOptions} from "@/store/abm";

export default {
  designScenario: designScenarios.bridge1,
  isLoading: false,
  moduleSettings: {
    bridge1: true,
    bridge2: false,
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
  }
}
