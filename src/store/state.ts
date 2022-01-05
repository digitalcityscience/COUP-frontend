import Config from "@/config/config.json";
import Defaults from "@/defaults";
import { StoreState, View } from "@/models";


const initialState: StoreState = {
  map: null,
  activeMenuComponent: "pedestrian",
  allFeaturesHighlighted: false,
  showLegend: false,
  selectedMultiFeatures: [],
  view: (Config["view"] || Defaults.view) as View,
  mapStyle: Config["mapStyle"] || Defaults.mapStyle,
  accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
  cityPyO: null,
  currentTime: 0,
  restrictedAccess: false,
  focusAreasGeoJson: null,
  focusAreasShown: false,
  openModalsIds: [],
  modalIndex: 1,
  selectedObjectId: null,
  featureCircles: [], // circles around features for feature highlighting
  visibleLayers: {
    focusAreas: false,
    abm: false,
    heat: false,
    amenities: false,
    noise: false,
    stormwater: false,
    trees: false,
    wind: false,
    sunExposure: false,
    multiLayerAnalysis: false,
  },
};

export default initialState;
