import {Module} from "vuex";
import state from "./state";
import actions from "./actions";
import mutations from "./mutations";
import getters from "./getters"

const scenario: Module<any, any> = {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}

export default scenario
