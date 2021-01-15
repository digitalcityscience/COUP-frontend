import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {bridges, mainStreetOrientationOptions }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    activeMenuComponent: "AbmScenario",
    layerIds: [],
    allFeaturesHighlighted: false,
    showLegend: false,
    selectedFeatures: [],
    selectedMultiFeatures: [],
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null,
    currentTime: 0,
    workshop: false,
    focusAreasGeoJson: null,
    focusAreasShown: false,
    openModals: [],
    modalInfo: {}
}

export default initialState;
