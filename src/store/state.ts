import Defaults from "@/defaults";
import Config from '@/config/config.json';
import {bridges, mainStreetOrientationOptions }  from '@/store/abm.ts';


const initialState: StoreState = {
    map: null,
    activeMenuComponent: "AbmScenario",
    layerIds: [],
    allFeaturesHighlighted: false,
    showLegend: false,
    selectedMultiFeatures: [],
    view: Config['view'] || Defaults.view,
    mapStyle: Config['mapStyle'] || Defaults.mapStyle,
    accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
    cityPyO: null,
    currentTime: 0,
    restrictedAccess: false,
    focusAreasGeoJson: null,
    focusAreasShown: false,
    openModalsIds: [],
    modalIndex: 0,
    selectedObjectId: null,
    featureCircles: [] // circles around features for feature highlighting
}

export default initialState;
