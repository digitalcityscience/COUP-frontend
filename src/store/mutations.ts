import { Source, GeoJSONSource, ImageSource, VectorSource, RasterSource, Layer } from 'mapbox-gl'
import Config from '@/config/config.json'

export default {
    addSource(state: StoreState, payload: RawSource) {

        // todo can we add mapbox layers as sources? should they be raw sources?
        state.map?.addSource(payload.id, payload.options)

      // add all layers that use this source
        Config.layers
            .filter(l => l.source === payload.id)
            .forEach(l => state.map?.addLayer(l as Layer))
    },
    addLayerId(state: StoreState, id: string) {
      if (!state.layerIds.includes(id)) {
        state.layerIds.push(id)
      }
    },
  // TODO: see if addLayer and addSource can be merged with addLayerID
  addLayer(state: StoreState, layer: any) {
    state.map?.addLayer(layer)
  },
    removeLayerId(state: StoreState, id: string) {
      state.layerIds = state.layerIds.filter(_id => _id !== id)
    }
}
