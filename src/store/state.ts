import { StoreState } from "@/models";

const initialState: StoreState = {
  map: null,
  appContext: null,
  activeMenuComponent: "pedestrian",
  showLegend: false,
  accessToken: process.env.VUE_APP_MAPBOX_TOKEN,
  cityPyO: null,
  restrictedAccess: false,
  focusAreasGeoJson: null,
  focusAreasShown: false,
  openModalsIds: [],
  modalIndex: 1,
  selectedObjectId: null,
  featureCircles: [], // circles around features for feature highlighting
};

export default initialState;
