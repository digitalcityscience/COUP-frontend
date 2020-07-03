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
    addLayer(state: StoreState, layer: any) {
      state.map?.addLayer(layer)
      },
    removeLayer(state: StoreState, payload: any | string) {
        const id = typeof payload === 'string' ? payload : payload.id

       // remove from map not from state:  state.layers = state.layers.filter(l => l.id !== id)
    }
}
