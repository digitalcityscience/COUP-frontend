import {designScenarios} from "@/store/abm";

export default {
  designScenario: designScenarios.bridge1,
  isLoading: false,
  moduleSettings: {
    bridge_1: true,
    bridge_2: false,
    roof_amenities: "random",
    blocks: "permeable",
    main_street_orientation: "vertical"
  },
  scenarioViewFilters: {
    student_or_adult: "adult",
    modes: {
      bicycle: true,
      car: true,
      foot: true,
      public_transport: true
    }
  }
}
