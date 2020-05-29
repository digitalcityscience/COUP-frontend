import map from './map/map'
import view from './view/view'
import Layers from './layers/layers'
import CRS from './crs/crs'

export default {
    namespaced: true,
    modules: {
        CRS,
        Layers
    },
    state: {
        ...map.state,
        ...view.state
    },
    getters: {
        ...map.getters,
        ...view.getters
    },
    mutations: {
        ...map.mutations,
        ...view.mutations
    },
    actions: {
        ...map.actions,
        ...view.actions
    }
}
