import Defaults from "@/defaults";
import Config from '@/config/config.json';

const initialState: StoreState = {
    map: null,
    layerIds: [],
    selectedFeatures: [],
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null
}

export default initialState;
