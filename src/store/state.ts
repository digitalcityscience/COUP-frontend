import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {designScenarios, mainStreetOrientationOptions }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    layerIds: [],
    currentTime: 0,
    selectedFeatures: [],
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null
}

export default initialState;
