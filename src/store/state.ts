import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {bridges, mainStreetOrientationOptions }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    selectedMultiFeatures: [],
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null,
    currentTime: 0,
}

export default initialState;
