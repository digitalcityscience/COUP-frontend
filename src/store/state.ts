import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {horizontalPathLayout, scenario_1} from "@/store/deck-layers";


const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    abmScenario: {
        designScenario: "scenario_1",
        moduleSettings: {
        pathLayout: horizontalPathLayout,
        walkTroughBuildings: true
      },
      scenarioViewFilters: {
        grasbrook_commuter: true,
      }
    },
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null
}

export default initialState;
