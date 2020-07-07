import {Layer} from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from '@deck.gl/mapbox';
import Config from '@/config/config.json'

export default {
  addLayerId(state: StoreState, id: string) {
    if (!state.layerIds.includes(id)) {
      state.layerIds.push(id)
    }
  },
  removeLayerId(state: StoreState, id: string) {
    state.layerIds = state.layerIds.filter(_id => _id !== id)
  },
  updateAbmScenario(state: StoreState, scenarioUpdate: any) {
    const key = Object.keys(scenarioUpdate)[0]
    state.abmScenario[key] = scenarioUpdate[key]
  }
}
