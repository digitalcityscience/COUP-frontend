import Vue from 'vue'
import Vuex from 'vuex'

import state from './state'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'
import scenario from './scenario'
import { generateSimpleGetters, generateSimpleMutations } from './utils/generators'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
      scenario: scenario
    },
    state,
    getters: {
        ...generateSimpleGetters(state),
        ...getters
    },
    mutations: {
        ...generateSimpleMutations(state),
        ...mutations
    },
    actions: {
        ...actions
    }
})
