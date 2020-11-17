import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import NoiseLayer from "@/config/noise.json";
import TrafficCountLayer from "@/config/trafficCounts.json";
import {abmTripsLayerName, animate, buildTripsLayer, abmAggregationLayerName, buildAggregationLayer} from "@/store/deck-layers";
import {bridges as bridgeNames, bridgeVeddelOptions} from "@/store/abm";
import {getFormattedTrafficCounts, noiseLayerName} from "@/store/noise";
import { mdiControllerClassicOutline } from '@mdi/js';

export default {
  updateNoiseScenario({state, commit, dispatch, rootState}) {
    // check if traffic counts already in store, otherwise load them from cityPyo
    if (!state.trafficCounts) {
      rootState.cityPyO.getLayer("trafficCounts", false).then(
        trafficData => {
          commit('trafficCounts', trafficData)
        })
    }
    // check if the requested noise result is already in store
    if (state.noiseResults.length > 0) {
      const noiseResult = state.noiseResults.filter(d => isNoiseScenarioMatching(d, state.noiseScenario))[0]
      const geoJsonData = noiseResult['geojson_result']
      dispatch('addNoiseMapLayer', geoJsonData)
        .then(
          dispatch('addTrafficCountLayer')
      )
    } else {
      // load noise data from cityPyo and add it to the store
      // gets one file containing all noise scenario result
      commit('resultLoading', true)
      rootState.cityPyO.getLayer("noiseScenarios", false).then(
        noiseData => {
          commit('noiseResults', noiseData["noise_results"])
          // select matching result for current scenario and add it to the map
          const noiseResult = noiseData["noise_results"].filter(d => isNoiseScenarioMatching(d, state.noiseScenario))[0]
          dispatch('addNoiseMapLayer', noiseResult['geojson_result'])
            .then(
              dispatch('addTrafficCountLayer'),
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
      if (rootState.map?.getLayer("abmTrips")) {
        rootState.map?.moveLayer(noiseLayerName, "abmTrips")
      }
    })
  },
  addTrafficCountLayer({state, commit, dispatch, rootState}) {
      //const scenarioTraffic = getFormattedTrafficCounts(state.trafficCountPoints, state.noiseScenario.traffic_percent)
      const scenarioTraffic = JSON.parse(JSON.stringify(state.trafficCounts))
      const trafficPercent = state.noiseScenario.traffic_percent
      scenarioTraffic["features"].forEach(point => {
        const carTrafficDaily = Math.floor(point["properties"]["car_traffic_daily"] * trafficPercent)
        const truckTrafficDaily = Math.floor(point["properties"]["truck_traffic_daily"] * trafficPercent)
        point["properties"]["car_traffic_daily"] = carTrafficDaily
        point["properties"]["truck_traffic_daily"] = truckTrafficDaily
        point["properties"]["description"] = "Cars: " + carTrafficDaily + " Trucks: " + truckTrafficDaily
      });

    const source = {
      id: TrafficCountLayer.mapSource.data.id,
      options: {
        type: 'geojson',
        data: scenarioTraffic
      }
    }
      dispatch('addSourceToMap', source, {root: true})
        .then(source => {
          dispatch('addLayerToMap', TrafficCountLayer.layer, {root: true})
        }).then(source => {
        // add layer on top of the layer stack
        rootState.map?.moveLayer(TrafficCountLayer.layer.id)
        })
  },
  hideNoiseMap({state, commit, dispatch, rootState}) {
    if (rootState.map?.getSource(NoiseLayer.mapSource.data.id)) {
      dispatch("removeSourceFromMap", NoiseLayer.mapSource.data.id, { root: true })
    }
  },
  loadWorkshopScenario({state, commit, dispatch, rootState}, scenarioId) {
    let bridges = updateBridges(
      bridgeNames.bridge_hafencity,
      bridgeVeddelOptions.diagonal,
    )

    commit('bridges', bridges)
    dispatch('updateBridgeLayer')
    dispatch('updateDeckLayer', scenarioId)
    dispatch('updateAmenitiesLayer', scenarioId)
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
  updateAmenitiesLayer({state, commit, dispatch, rootState}, workshopId) {
    // load new data from cityPyo
    let amenitiesLayerName = workshopId || Amenities.mapSource.data.id

    rootState.cityPyO.getAbmAmenitiesLayer(amenitiesLayerName, state).then(
      source => {
        console.log("got amenities", source)
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
  updateDeckLayer({state, commit, dispatch, rootState}, workshopScenario) {
    // show loading screen
    commit('resultLoading', true)

    let scenarioName = workshopScenario || abmTripsLayerName

    // load new data from cityPyo
    rootState.cityPyO.getAbmResultLayer(scenarioName, state).then(
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
            commit('abmData', deckLayer?.props?.data)
            dispatch('preclusteringAbm', deckLayer?.props?.data)
            // finally remove loading screen
            commit('resultLoading', false)

            const abmData = state.abmData;
            const activeAbmSet = state.activeAbmSet;

            //if (!heatMap) {
              commit('animationRunning', true);
              animate(deckLayer, null, null, state.currentTimeStamp)
            //}
          }
        )
      }
    )
    return
  },
  preclusteringAbm({state, commit, dispatch, rootState}, abm){
    const abmObj = {};
    console.log(abm);
    abm.forEach((v)=> {
      for (const [key, value] of Object.entries(v.agent)) {
        if(`${key}` !== 'id' && `${key}` !== 'source'){
          if(`${value}` !== 'unknown' && `${value}` !== 'nil'){
            abmObj[`${value}`] = abmObj[`${value}`] || [];
            abmObj[`${value}`].push(v.agent.id);
          }
        }
      }
    });
    console.log("PRECLUSTERED ABMOBJ", abmObj);
    commit('clusteredAbmData', abmObj);
  },
  filterAbmCore({state, commit, dispatch, rootState}, filterSettings){
    const abmData = state.abmData;
    const filterSet = {...state.clusteredAbmData};
    console.log("FilterSET!", filterSet);
    const spliceArr = [];
    //console.log(JSON.parse(JSON.stringify(filterSet)));
    Object.entries(filterSettings).forEach(([key, value]) => {
      if(value === true){
        delete filterSet[key];
      } else {
        filterSet[key].forEach(v => {
          spliceArr.push(v);
        });
      }
    });

    console.log("SPLICE ARRAY", spliceArr)
    const filteredAbm = abmData.filter(v => !spliceArr.includes(v.agent.id));
    console.log("FINAL FILTER VALUES", filteredAbm)
    commit('activeAbmSet', filteredAbm);
    dispatch('rebuildDeckLayer');
  },
  rebuildTripsLayer({state, commit, dispatch, rootState}){
    const activeAbmSet = state.activeAbmSet;
    if(activeAbmSet != null && activeAbmSet != 'undefined'){
      var abmData = activeAbmSet;
    } else {
      var abmData = state.abmData;
    }

    buildTripsLayer(abmData, state.currentTimeStamp).then(
      deckLayer => {

        if(rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName)
        }

        rootState.map?.addLayer(deckLayer)
        rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
        commit('addLayerId', abmTripsLayerName, {root: true});

        commit('animationRunning', true);
        animate(deckLayer, null, null, state.currentTimeStamp);
      });
  },
  rebuildDeckLayer({state, commit, dispatch, rootState}){ /*recalculate DeckLayer if HeatMap or TripsLayer is somehow changed*/
    //const abmData = state.abmData;
    const activeAbmSet = state.activeAbmSet;

    if(activeAbmSet != null && activeAbmSet != 'undefined'){
      var abmData = activeAbmSet;
    } else {
      var abmData = state.abmData;
    }

    /*Passing different setting for absolute (not average) and relative aggLayer data*/
    const settings = (state.heatMapType == 'average') ? [4, 0.03, 50, 0.5] : [26, 0.01, 80, 0.5];
    const heatMapTypeData = (state.heatMapType == 'average') ? state.heatMapAverage : state.heatMapData;
    console.log("try to rebuild active deck layers");

    buildTripsLayer(abmData, state.currentTimeStamp).then(
      deckLayer => {
        /*Do not remove Aggregation Layer on Building Trips Layer anymore
        if (rootState.map?.getLayer(abmAggregationLayerName)) {
          rootState.map?.removeLayer(abmAggregationLayerName)
          commit('removeLayerId', abmAggregationLayerName, {root: true})
        }*/

        if(rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName)
        }

        rootState.map?.addLayer(deckLayer)
        rootState.map?.moveLayer(abmTripsLayerName, "groundfloor")  // add layer on top of the groundfloor layer
        commit('addLayerId', abmTripsLayerName, {root: true});

        commit('animationRunning', true);
        animate(deckLayer, null, null, state.currentTimeStamp);
      });

      if(state.heatMap){
        /*building Deck.gl Heatmap in deck-layers.ts*/
        buildAggregationLayer(heatMapTypeData, settings).then(
          deckLayer => {
            if (rootState.map?.getLayer(abmAggregationLayerName)) {
              rootState.map?.removeLayer(abmAggregationLayerName)
            }
  
            /*if(rootState.map?.getLayer(abmTripsLayerName)) {
              rootState.map?.removeLayer(abmTripsLayerName);
              commit('removeLayerId', abmTripsLayerName, {root: true})
            }*/
  
            console.log("new aggregation layer loaded");
            rootState.map?.addLayer(deckLayer)
            commit('addLayerId', abmAggregationLayerName, {root: true})
            if (rootState.map?.getLayer("groundfloor")) {
              rootState.map?.moveLayer("abmHeat", "groundfloor")
            }
  
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
