import Vue from 'vue'
import Vuex from 'vuex'
import VModal from 'vue-js-modal'
import state from './state'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'
import scenario from './scenario'
import Contextmenu from '@/components/Menu/Contextmenu.vue'
import UseTypesLegend from '@/components/Menu/UseTypesLegend.vue'
import {generateSimpleGetters, generateSimpleMutations} from './utils/generators'

Vue.use(Vuex)

const store = new Vuex.Store({
    modules: {
      scenario
    },
    state,
    getters: {
        ...generateSimpleGetters(state),
        ...getters,
    },
    mutations: {
        ...generateSimpleMutations(state),
        ...mutations
    },
    actions: {
        ...actions
    }
})
Vue.component('ctx-menu', Contextmenu);
Vue.component('use-types-legend', UseTypesLegend);

Vue.use(VModal, {
    dynamicDefaults: {
      draggable: true,
      height: 'auto'
    }
  })

// @ts-ignore
window.$store = store;

export default store;
