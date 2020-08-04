import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {designScenarios, mainStreetOrientationOptions }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    abmScenario: {
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
    },
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null
}

export default initialState;
