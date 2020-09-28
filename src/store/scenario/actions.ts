import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import NoiseLayer from "@/config/noise.json";
import {abmTripsLayerName, animate, buildTripsLayer, abmAggregationLayerName, buildAggregationLayer} from "@/store/deck-layers";
import {noiseLayerName} from "@/store/noise";
import {bridges as bridgeNames, bridgeVeddelOptions} from "@/store/abm";

export default {
  updateNoiseScenario({state, commit, dispatch, rootState}) {
    // check if the requested noise result is already in store
    if (state.noiseResults.length > 0) {
      const noiseResult = state.noiseResults.filter(d => isNoiseScenarioMatching(d, state.noiseScenario))[0]
      const geoJsonData = noiseResult['geojson_result']
      dispatch('addNoiseMapLayer', geoJsonData)
    } else {
      // load noise data from cityPyo and add it to the store
      // gets one file containing all noise scenario result
      commit('resultLoading', true)
      rootState.cityPyO.getLayer("noiseScenarios", false).then(
        noiseData => {
          commit('noiseResults', noiseData["noise_results"])
          const noiseResult = noiseData["noise_results"].filter(d => isNoiseScenarioMatching(d, state.noiseScenario))[0]
          dispatch('addNoiseMapLayer', noiseResult['geojson_result']).then(
            commit('resultLoading', false)
          )
      })
    }
  },
  addNoiseMapLayer({state, commit, dispatch, rootState}, geoJsonData) {
    const source = {
      id: NoiseLayer.mapSource.data.id,
      options: {
        type: 'geojson',
        data: geoJsonData
      }
    }
    dispatch('addSourceToMap', source, {root: true})
      .then(source => {
        dispatch('addLayerToMap', NoiseLayer.layer, {root: true})
      }).then(source => {
      // add layer on top of the layer stack
      if (rootState.map?.getLayer("spaces")) {
        rootState.map?.moveLayer(noiseLayerName, "spaces")
      }
    })
  },
  hideNoiseMap({state, commit, dispatch, rootState}) {
    if (rootState.map?.getSource(NoiseLayer.mapSource.data.id)) {
      dispatch("removeSourceFromMap", NoiseLayer.mapSource.data.id, { root: true })
    }
  },
  updateAbmDesignScenario({state, commit, dispatch, rootState}) {
    // update scenario name

    let bridges = updateBridges(
      state.moduleSettings.bridge_hafencity,
      state.moduleSettings.bridge_veddel
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
    commit('resultLoading', true)

    // load new data from cityPyo
    rootState.cityPyO.getAbmResultLayer(abmTripsLayerName, state).then(
      result => {
        // remove old trips layer from map
        if (!result) {
          if (rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName)
          }
          // finally remove loading screen
          commit('resultLoading', false)
          return
        }

        buildTripsLayer(result.options.data, state.currentTimeStamp).then(
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
            commit('resultLoading', false)
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

function updateBridges(bridge_hafencity, bridge_veddel) {
  let bridges = []

  if (bridge_hafencity) {
    bridges.push(bridgeNames.bridge_hafencity)
  }
  if (bridge_veddel == bridgeVeddelOptions.horizontal) {
    bridges.push(bridgeNames.bridge_veddel_horizontal)
  }
  if (bridge_veddel == bridgeVeddelOptions.diagonal) {
    bridges.push(bridgeNames.bridge_veddel_diagonal)
  }

  return bridges
}

function isNoiseScenarioMatching(noiseDataSet,noiseScenario) {
  return noiseDataSet["noise_scenario"]["traffic_percent"] == noiseScenario.traffic_percent
    && noiseDataSet["noise_scenario"]["max_speed"] == noiseScenario.max_speed;
}
