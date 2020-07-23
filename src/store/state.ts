import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {designScenarios, pathWaySettings, moduleSettings }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    abmScenario: {
        designScenario: designScenarios.bridge1,
        moduleSettings: {
          pathLayout: pathWaySettings.verticalPathways,
          walkThroughBuildings: false
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
