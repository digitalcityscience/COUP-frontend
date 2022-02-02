import { abmTripsLayerName } from "@/services/deck.service";

export default {
  getAbmData(state, getters, rootState) {
    const deckLayer = rootState.map?.getLayer(abmTripsLayerName);
    return deckLayer?.implementation?.props?.data;
  },
};
