import {Module} from "vuex";
import Scenarios from "@/config/scenarios.json";
import {abmTripsLayerName, buildTripsLayer, animate} from "@/store/deck-layers";

const scenario: Module<any, any> = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    updateAbmDesignScenario({state, commit, dispatch, rootState}, payload) {
      rootState.abmScenario.designScenario = payload.scenarioName // update ABM Scenario in store

      dispatch('updateDesignScenarioLayer')
      dispatch('updateDeckLayer')
    },
    // load new source from cityPyo due to new scenario settings and re-add layer to the map
    updateAbmDesignScenarioSettings({state, commit, dispatch, rootState}, payload) {
      // update ABM Scenario in store
      const valueKey = Object.keys(payload)[0]
      rootState.abmScenario.moduleSettings[valueKey] = payload[valueKey]

      dispatch('updateDeckLayer')
    },
    // load layer source from cityPyo and add the layer to the map
    updateDesignScenarioLayer({state, commit, dispatch, rootState}, payload) {
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
      if (rootState.map?.getLayer(abmTripsLayerName)) {
        rootState.map?.removeLayer(abmTripsLayerName)
      }
      // load new data from cityPyo
      rootState.cityPyO.getScenarioResultLayer(abmTripsLayerName, rootState.abmScenario).then(
        result => {
          let deckLayer = buildTripsLayer(result.options.data.data.abm)
          console.log(deckLayer)
          rootState.map?.addLayer(deckLayer)
          commit('addLayerId', abmTripsLayerName, { root:true })
          animate(deckLayer)
        }
      )
    }
  }
}

export default scenario;
