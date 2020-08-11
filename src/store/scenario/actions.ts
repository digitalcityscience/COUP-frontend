import Scenarios from "@/config/scenarios.json";
import {abmTripsLayerName, animate, buildTripsLayer} from "@/store/deck-layers";

export default {
  // load new source from cityPyo due to new scenario settings and re-add layer to the map
  updateAbmDesignScenario({state, commit, dispatch, rootState}) {
    // update scenario name

    state.designScenario = getScenarioName(
      state.moduleSettings.bridge1,
      state.moduleSettings.bridge2
    )

    dispatch('updateDeckLayer')
    dispatch('updateDesignScenarioLayer')
  },
  // load layer source from cityPyo and add the layer to the map
  updateDesignScenarioLayer({state, commit, dispatch, rootState}, payload) {
    // delete any scenario layer that is still on the map, before adding a new one
    Scenarios.layers.forEach(layer => {
      if (rootState.map?.getSource(layer.source)) {
        dispatch("removeSourceFromMap", layer.source, { root: true })
      }
    })
    // identify new scenario layer and add it to the map
    const layer = Scenarios.layers.filter(layer => layer.id === state.designScenario)[0]
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
    commit('abmResultLoading', true)

    // load new data from cityPyo
    rootState.cityPyO.getAbmResultLayer(abmTripsLayerName, state).then(
      result => {
        // remove old trips layer from map
        if (!result) {
          if (rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName)
          }

          commit('abmResultLoading', false)
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
            animate(deckLayer)

            // finally remove loading screen
            commit('abmResultLoading', false)
          })
      }
    )
    return
  }
}

function getScenarioName(bridge1, bridge2) {
  if (bridge1 && bridge2) {
    return "all_bridges"
  } else if (bridge1) {
    return "bridge1"
  } else if (bridge2) {
    return "bridge2"
  }
}
