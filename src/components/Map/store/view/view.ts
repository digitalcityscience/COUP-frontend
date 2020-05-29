import { View } from 'ol'
import * as olProj from 'ol/proj'
import Config from '@/config/config.json'
import { defaultView } from '@/defaults'
import { generateSimpleGetters, generateSimpleMutations } from '@/store/utils/generators'

const initialState = {
    view: new View({
        center: olProj.fromLonLat(Config.Map?.View?.center || defaultView.center),
        zoom: Config.Map?.View?.zoom || defaultView.zoom
    })
}

export default {
    state: {
        ...initialState
    },
    getters: {
        ...generateSimpleGetters(initialState)
    },
    mutations: {
        ...generateSimpleMutations(initialState)
    },
    actions: {}
}
