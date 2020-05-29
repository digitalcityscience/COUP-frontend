import Vue from 'vue'
import Vuex from 'vuex'
import Map from '@/components/Map/store'
import GFI from '@/components/GFI/GFI'

import state from './state'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        Map,
        GFI
    },
    state,
    getters,
    mutations,
    actions
})
