import {ActionContext, Module, Store} from "vuex";
import Scenarios from "@/config/scenarios.json";
import {Layer} from "mapbox-gl";

const scenario: Module<any, any> = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    updateAbmDesignScenario({state, commit, dispatch, rootState}, payload) {
      // update scenario
      console.log("update scenario")
      rootState.abmScenario.designScenario = payload.scenarioName
      dispatch('addDesignScenarioLayer')
      dispatch('updateDeckLayer')

    },
    updateAbmDesignScenarioSettings({state, commit, dispatch, rootState}, payload) {
      console.log("changing scenario settings")
      console.log(payload)
    },
    addDesignScenarioLayer({state, commit, dispatch, rootState}, payload) {
      const layer = Scenarios.layers.filter(layer => layer.id === rootState.abmScenario.designScenario)[0]
      const layerSources = Scenarios.sources.filter(source => source.id == layer.source)
      layerSources.forEach(layerSource => {
        rootState.cityPyO.getLayer(layerSource.data.id)
          .then(source => {
            dispatch('addSourceToMap', source, { root: true })
              .then(source => {
                dispatch('addLayerToMap', layer, { root: true })
              })
          })
      })
    },
    updateDeckLayer({state, commit, dispatch, rootState}, payload) {

    }

  }
}

export default scenario;
