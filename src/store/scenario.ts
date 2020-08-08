import {Module} from "vuex";
import Scenarios from "@/config/scenarios.json";
import {abmTripsLayerName, buildTripsLayer, animate} from "@/store/deck-layers";
import { getQuantileDomain } from '@deck.gl/aggregation-layers/utils/scale-utils';

const scenario: Module<any, any> = {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    // load new source from cityPyo due to new scenario settings and re-add layer to the map
    updateAbmDesignScenarioSettings({state, commit, dispatch, rootState}, payload) {
      // update ABM Scenario in store
      const valueKey = Object.keys(payload)[0]
      rootState.abmScenario.moduleSettings[valueKey] = payload[valueKey]

      // update scenario name
      rootState.abmScenario.designScenario = getScenarioName(
        rootState.abmScenario.moduleSettings.bridge_1,
        rootState.abmScenario.moduleSettings.bridge_2
      )

      dispatch('updateDeckLayer')
      dispatch('updateDesignScenarioLayer')
    },
    updateAbmDataFilter({state, commit, dispatch, rootState}, payload) {
      const valueKey = Object.keys(payload)[0]
      const value = payload[valueKey]

      if (value) {
        rootState.abmScenario.scenarioViewFilters[valueKey] = payload[valueKey]
      } else {
        // delete filter
        delete rootState.abmScenario.scenarioViewFilters[valueKey]
      }
      dispatch('updateDeckLayer')
    },
    updateAbmDataModeFilter({state, commit, dispatch, rootState}, payload) {
      const valueKey = Object.keys(payload)[0]
      rootState.abmScenario.scenarioViewFilters.modes[valueKey] = payload[valueKey]
      dispatch('updateDeckLayer')
    },
    // load layer source from cityPyo and add the layer to the map
    updateDesignScenarioLayer({state, commit, dispatch, rootState}, payload) {
      // delete any scenario layer that is still on the map, before adding a new one
      Scenarios.layers.forEach(layer => {
        if (rootState.map?.getSource(layer.source)) {
          console.log("deleting this source", layer.source)
          dispatch("removeSourceFromMap", layer.source, { root: true })
        }
      })
      // identify new scenario layer and add it to the map
      const layer = Scenarios.layers.filter(layer => layer.id === rootState.abmScenario.designScenario)[0]
      if (layer) {
        const layerSources = Scenarios.sources.filter(source => source.id == layer.source)
        layerSources.forEach(layerSource => {
          rootState.cityPyO.getLayer(layerSource.data.id)
            .then(source => {
              // check if scenario is still valid - user input might have changed while loading layer
              dispatch('addSourceToMap', source, { root: true })
                .then(source => {
                  dispatch('addLayerToMap', layer, { root: true })
                })
            })
        })
      }
    },
    updateDeckLayer({state, commit, dispatch, rootState}, payload) {
      // show loading screen
      commit('abmResultLoading', true, {root: true})

      // load new data from cityPyo
      rootState.cityPyO.getAbmResultLayer(abmTripsLayerName, rootState.abmScenario).then(
        result => {
          // remove old trips layer from map
          if (!result) {
            if (rootState.map?.getLayer(abmTripsLayerName)) {
              rootState.map?.removeLayer(abmTripsLayerName)
            }

            commit('abmResultLoading', false, {root: true})
            return
          }
          buildTripsLayer(result.options.data.data).then(
            deckLayer => {
              if (rootState.map?.getLayer(abmTripsLayerName)) {
                rootState.map?.removeLayer(abmTripsLayerName)
              }
            // check if scenario is still valid - user input might have changed while loading trips layer
            rootState.map?.addLayer(deckLayer)
            commit('addLayerId', abmTripsLayerName, {root: true})
            animate.call(this, deckLayer);

            // finally remove loading screen
            commit('abmResultLoading', false, {root: true});
            })
        }
      )
    }
  }
}

export default scenario;

function getScenarioName(bridge1, bridge2) {
  if (bridge1 && bridge2) {
    return "all_bridges"
  } else if (bridge1) {
   return "bridge1"
  } else if (bridge2) {
    return "bridge2"
  }
}
