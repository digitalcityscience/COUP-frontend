import { Source, GeoJSONSource, ImageSource, VectorSource, RasterSource, Layer } from 'mapbox-gl'
import Config from '@/config/config.json'

export default {
    addLayerId(state: StoreState, id: string) {
        if (!state.layerIds.includes(id)) {
            state.layerIds.push(id)
        }
    },
    removeLayerId(state: StoreState, id: string) {
        state.layerIds = state.layerIds.filter(_id => _id !== id)
    }
}
