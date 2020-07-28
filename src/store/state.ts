import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {designScenarios, pathWaySettings }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    abmScenario: {
        designScenario: designScenarios.bridge1,
        moduleSettings: {
          bridge_1: true,
          amenities_roof: "random",
          blocks: "open",
          bridge_2: false,
          paths: "vertical"
      },
      scenarioViewFilters: {
        mode: "foot",
      }
    },
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null
}

export default initialState;
