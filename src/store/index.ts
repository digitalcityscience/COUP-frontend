import Vue from "vue";
import Vuex from "vuex";
import VModal from "vue-js-modal";
import state from "./state";
import getters from "./getters";
import actions from "./actions";
import scenario from "./scenario";
import Contextmenu from "@/components/Menu/Contextmenu.vue";
import {
  generateSimpleGetters,
  generateSimpleMutations,
} from "./utils/generators";
import stormwater from "./stormwater";
import wind from "./wind";
import noise from "./noise";
import abm from "./abmStore";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    scenario,
    stormwater,
    wind,
    noise,
    abm,
  },
  state,
  getters: {
    ...generateSimpleGetters(state),
    ...getters,
  },
  mutations: {
    ...generateSimpleMutations(state),
  },
  actions: {
    ...actions,
  },
});
Vue.component("ctx-menu", Contextmenu);

Vue.use(VModal, {
  dynamicDefaults: {
    draggable: true,
    height: "auto",
  },
});

// @ts-ignore
window.$store = store;

export default store;
