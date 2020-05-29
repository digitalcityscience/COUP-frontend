import { generateSimpleGetters, generateSimpleMutations } from '@/store/utils/generators'
import { Feature } from 'ol'

const initialState = {
    active: true,
    selectedFeatures: []
}

export default {
    namespaced: true,
    state: {
        ...initialState
    },
    getters: {
        ...generateSimpleGetters(initialState),
        selectedFeaturesInfo: s => s.selectedFeatures.map(f => f.getProperties())
    },
    mutations: {
        ...generateSimpleMutations(initialState)
    },
    actions: {
        toggleSelectedFeatures ({state}, features: Feature[]) {
            features.forEach(feature => {
                if (state.selectedFeatures.find((f: Feature) => f === feature)) {
                    state.selectedFeatures = state.selectedFeatures.filter((f: Feature) => f === feature)
                }
                else {
                    state.selectedFeatures.push(feature)
                }
            })
        }
    }
}