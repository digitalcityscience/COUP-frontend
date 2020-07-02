import { Source, GeoJSONSource, ImageSource, VectorSource, RasterSource, Layer } from 'mapbox-gl'
import Config from '@/config/config.json'

export default {
    addSource(state: StoreState, payload: RawSource) {
        state.map?.addSource(payload.id, payload.options)
        
        Config.layers
            .filter(l => l.source === payload.id)
            .forEach(l => state.map?.addLayer(l as Layer))
    },
    removeLayer(state: StoreState, payload: any | string) {
        const id = typeof payload === 'string' ? payload : payload.id

        state.layers = state.layers.filter(l => l.id !== id)
    }
}
