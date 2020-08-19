import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import {abmTripsLayerName, animate, buildTripsLayer} from "@/store/deck-layers";
import {bridges as bridgeNames, bridgeSouthOptions} from "@/store/abm";

export default {
  // load new source from cityPyo due to new scenario settings and re-add layer to the map
  updateAbmDesignScenario({state, commit, dispatch, rootState}) {
    // update scenario name

    let bridges = updateBridges(
      state.moduleSettings.bridge_north,
      state.moduleSettings.bridge_south
    )

    commit('bridges', bridges)
    dispatch('updateDeckLayer')
    dispatch('updateBridgeLayer')
    dispatch('updateAmenitiesLayer')
  },
  // load layer source from cityPyo and add the layer to the map
  updateAmenitiesLayer({state, commit, dispatch, rootState}, payload) {
    // load new data from cityPyo
    rootState.cityPyO.getAbmAmenitiesLayer(Amenities.mapSource.data.id, state).then(
      source => {
        dispatch('addSourceToMap', source, {root: true})
          .then(source => {
            dispatch('addLayerToMap', Amenities.layer, {root: true})
          })
      })
  },
  // load layer source from cityPyo and add the layer to the map
  updateBridgeLayer({state, commit, dispatch, rootState}, payload) {
    // delete any bridge layer that is still on the map, before adding a new one

    // TODO this part can be deleted?? is already moved when calling "addSourceToMap"
    Bridges.layers.forEach(layer => {
      if (rootState.map?.getSource(layer.source)) {
        dispatch("removeSourceFromMap", layer.source, { root: true })
      }
    })
    // identify new scenario layer and add it to the map
    const layers = []
    for (let bridgeName of state.bridges) {
      console.log("bridgeToCheck", bridgeName)
      layers.push(Bridges.layers.filter(layer => layer.id === bridgeName)[0])
    }
      console.log("found layers", layers)
      if (layers) {
        const mapSource = Bridges.mapSource
        rootState.cityPyO.getLayer(mapSource.data.id)
            .then(source => {
              dispatch('addSourceToMap', source, {root: true})
                .then(source => {
                  layers.forEach(layer => dispatch('addLayerToMap', layer, {root: true}))
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
        } else {
          buildTripsLayer(result.options.data.data).then(
            deckLayer => {
              if (rootState.map?.getLayer(abmTripsLayerName)) {
                rootState.map?.removeLayer(abmTripsLayerName)
              }
              // check if scenario is still valid - user input might have changed while loading trips layer
              rootState.map?.addLayer(deckLayer)
              rootState.map?.moveLayer(abmTripsLayerName);  // add layer on top of the layer stack
              commit('addLayerId', abmTripsLayerName, {root: true})
              animate(deckLayer)

              commit('abmData', deckLayer?.props?.data)

              // finally remove loading screen
              commit('abmResultLoading', false)
            })
        }
      }
    )
    return
  }
}

function updateBridges(bridge_north, bridge_south) {
  let bridges = []

  if (bridge_north) {
    bridges.push(bridgeNames.bridge_north)
  }
  if (bridge_south == bridgeSouthOptions.horizontal) {
    bridges.push(bridgeNames.bridge_south_horizontal)
  }
  if (bridge_south == bridgeSouthOptions.diagonal) {
    bridges.push(bridgeNames.bridge_south_diagonal)
  }

  return bridges
}
