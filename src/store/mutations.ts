import {Layer} from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from '@deck.gl/mapbox';
import Config from '@/config/config.json'

export default {
  addLayerId(state: StoreState, id: string) {
    if (!state.layerIds.includes(id)) {
      console.log("new layer added with id", id)
      state.layerIds.push(id)
    }
  },
  removeLayerId(state: StoreState, id: string) {
    state.layerIds = state.layerIds.filter(_id => _id !== id)
  },
  abmResultLoading(state: StoreState, isLoading: boolean) {
    console.log("resetting is loading", isLoading)
    state.abmScenario.isLoading = isLoading
  }
}
