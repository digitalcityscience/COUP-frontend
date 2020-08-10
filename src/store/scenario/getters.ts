
import {abmTripsLayerName, buildTripsLayer, animate} from "@/store/deck-layers";

export default {
    getAbmData(state, getters, rootState) {
        const deckLayer = rootState.map?.getLayer(abmTripsLayerName);
        return deckLayer?.implementation?.props?.data;
    }
}