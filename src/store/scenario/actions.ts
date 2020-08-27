import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import {abmTripsLayerName, animate, buildTripsLayer, abmAggregationLayerName, buildAggregationLayer} from "@/store/deck-layers";
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
    dispatch('updateBridgeLayer')
    dispatch('updateDeckLayer')
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
          }).then(source => { rootState.map?.moveLayer(Amenities.layer.id, "groundfloor")}  // add layer on top of the layer stack
          )
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
                  layers.forEach(layer => {
                    dispatch('addLayerToMap', layer, {root: true})
                    // put bridge layer on top of spaces
                    if (rootState.map?.moveLayer(layer.id, "spaces")) {
                      rootState.map?.moveLayer(layer.id, "spaces")
                    }
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

        buildTripsLayer(result.options.data.data, state.currentTimeStamp).then(
          deckLayer => {
            if (rootState.map?.getLayer(abmTripsLayerName)) {
              rootState.map?.removeLayer(abmTripsLayerName)
            }

            // check if scenario is still valid - user input might have changed while loading trips layer
            rootState.map?.addLayer(deckLayer)
            rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
            commit('addLayerId', abmTripsLayerName, {root: true})

            const heatMap = state.heatMap;
            if (!heatMap) {
              commit('animationRunning', true);
              animate(deckLayer, null, null, state.currentTimeStamp)
            }

            commit('abmData', deckLayer?.props?.data)

            // finally remove loading screen
            commit('abmResultLoading', false)
          }
        )
      }
    )
    return
  },
  rebuildDeckLayer({state, commit, dispatch, rootState}){ /*recalculate DeckLayer if HeatMap or TripsLayer is somehow changed*/
    const abmData = state.abmData;
    const settings = (state.heatMapType == 'average') ? [4, 0.03, 50, 0.5] : [26, 0.01, 80, 0.5];
    const heatMapTypeData = (state.heatMapType == 'average') ? state.heatMapAverage : state.heatMapData;
    console.log("try to rebuild active deck layer");
    if(state.heatMap){
      /*building Deck.gl Heatmap in deck-layers.ts*/
      buildAggregationLayer(heatMapTypeData, settings).then(
        deckLayer => {
          if (rootState.map?.getLayer(abmAggregationLayerName)) {
            rootState.map?.removeLayer(abmAggregationLayerName)
          }

          if(rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName);
            commit('removeLayerId', abmTripsLayerName, {root: true})
          }

          console.log("new aggregation layer loaded");
          rootState.map?.addLayer(deckLayer)
          commit('addLayerId', abmAggregationLayerName, {root: true})

        });
    } else if (!state.heatMap) { /*if heatMap is not active, reactivate TripsLayer*/

      /*building Deck.gl TripsLayer in deck-layers.ts*/
      buildTripsLayer(abmData, state.currentTimeStamp).then(
        deckLayer => {
          if (rootState.map?.getLayer(abmAggregationLayerName)) {
            rootState.map?.removeLayer(abmAggregationLayerName)
            commit('removeLayerId', abmAggregationLayerName, {root: true})
          }

          if(rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName)
          }

          console.log(deckLayer);
          rootState.map?.addLayer(deckLayer)
          rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
          commit('addLayerId', abmTripsLayerName, {root: true});

          /*animating TripsLayer*/
          commit('animationRunning', true);
          animate(deckLayer, null, null, state.currentTimeStamp);
        });
      }
  },
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
