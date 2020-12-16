import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import NoiseLayer from "@/config/noise.json";
import TrafficCountLayer from "@/config/trafficCounts.json";
import {abmTripsLayerName, animate, buildTripsLayer, abmAggregationLayerName, buildAggregationLayer} from "@/store/deck-layers";
import {bridges as bridgeNames, bridgeVeddelOptions} from "@/store/abm";
import {getFormattedTrafficCounts, noiseLayerName} from "@/store/noise";
import { mdiControllerClassicOutline } from '@mdi/js';
import { VCarouselReverseTransition } from 'vuetify/lib';

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
    dispatch('initialAbmComputing')
    //dispatch('updateDeckLayer')
    dispatch('updateAmenitiesLayer')
  },
  // load layer source from cityPyo and add the layer to the map
  updateAmenitiesLayer({state, commit, dispatch, rootState}, workshopId) {
    // load new data from cityPyo
    let amenitiesLayerName = workshopId || Amenities.mapSource.data.id

    rootState.cityPyO.getAbmAmenitiesLayer(amenitiesLayerName, state).then(
      source => {
        console.log("got amenities", source)
        commit('amenitiesGeoJson', source.options.data)
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
  //LOADING INITIAL ABM DATA
  initialAbmComputing({state, commit, dispatch, rootState}, workshopScenario){
    //show loading screen
    commit('resultLoading', true)
    commit("loader", true);

    //check if special workshop Scenario should be loaded
    let scenarioName = workshopScenario || abmTripsLayerName

    //LOAD DATA FROM CITYPYO

    commit("loaderTxt", "Getting ABM Simulation Data from CityPyO ... ");
    rootState.cityPyO.getAbmResultLayer(scenarioName, state).then(
      result => {
        if (!result) {
          alert("There was an error requesting the data from the server. Please get in contact with the admins.");
          //remove loading screen
          commit('resultLoading', false)
          return
        }


        commit("loaderTxt", "Serving Abm Data ... ");
        commit('abmData', result.options?.data);
        dispatch("computeLoop", result.options?.data);
      }
    )
  },
  //compute ABM Data Set
  computeLoop({state, commit, dispatch, rootState}, abmCore){

    var agentIndexes = {};
    var abmFilterData = {};
    var timePaths = [];
    var simpleTimeData = {};

    console.log(abmCore);
    //go through each agent inside the abm set (agent, index, array)

    commit("loaderTxt", "Clustering ABM Data for functional purposes ... ");
    abmCore.forEach((who,index,array) => {
      let agent_id = who.agent.id;

      // #0 create a simple lookup with all agent id's and their index in the abmCore
      agentIndexes[agent_id] = index

      // #1 Clustering Agent Sets for faster Filtering in Frontend
      // ---------------- FILTER SET -----------------------------
      for (const [key, value] of Object.entries(who.agent)) {
        if(`${key}` !== 'id' && `${key}` !== 'source'){
          if(`${value}` !== 'unknown' && `${value}` !== 'nil'){
            abmFilterData[`${value}`] = abmFilterData[`${value}`] || [];
            abmFilterData[`${value}`].push(agent_id);
          }
        }
      }

      // ---------------- FILTER SET END--------------------------

      // #2 Clustering TIME DATA for Aggregation Layer
      // ---------------- TIME DATA ------------------------------


      commit("loaderTxt", "Analyzing Time Data ... ");
      who.timestamps.forEach((v,i,a) => {
        /*round timestamps to full hours*/
        var h = Math.floor(v / 3600) + 8;
        /*create object keys from full hours*/
        timePaths[h] = timePaths[h] || {};
        timePaths[h].busyAgents = timePaths[h].busyAgents || [];
        timePaths[h].values = timePaths[h].values || {};
        timePaths[h].stamps = timePaths[h].stamps + 1 || 1;
        let coords = who.path[i].toString();

        timePaths[h].values[coords] = timePaths[h].values[coords] || [];
        //timePaths[h].values[coords].agents = timePaths[h].values[coords].agents || [agent_id];
        if (!timePaths[h].values[coords].includes(agent_id)) timePaths[h].values[coords].push(agent_id);
        //timePaths[h].values[coords].weight = timePaths[h].values[coords].agents.length;

        /*simpleTimeData[v] = simpleTimeData[v] || [];
        simpleTimeData[v].push(agent_id);*/


        commit("loaderTxt", "Creating Simple Time Data Arrays ... ");
        simpleTimeData[Math.floor(v/300)*300] = simpleTimeData[Math.floor(v/300)*300] || {};
        simpleTimeData[Math.floor(v/300)*300]["all"] = simpleTimeData[Math.floor(v/300)*300]["all"] || [];
        simpleTimeData[Math.floor(v/300)*300][who.agent.mode] = simpleTimeData[Math.floor(v/300)*300][who.agent.mode] || [];
        simpleTimeData[Math.floor(v/300)*300][who.agent.agent_age] = simpleTimeData[Math.floor(v/300)*300][who.agent.agent_age] || [];
        simpleTimeData[Math.floor(v/300)*300][who.agent.resident_or_visitor] = simpleTimeData[Math.floor(v/300)*300][who.agent.resident_or_visitor] || [];
        simpleTimeData[Math.floor(v/300)*300]["all"].push(agent_id);
        simpleTimeData[Math.floor(v/300)*300][who.agent.mode].push(agent_id);
        simpleTimeData[Math.floor(v/300)*300][who.agent.agent_age].push(agent_id);
        simpleTimeData[Math.floor(v/300)*300][who.agent.resident_or_visitor].push(agent_id);


        commit("loaderTxt", "Creating Busy Agents ... ");
        if(i == 0){
          timePaths[h].busyAgents.push(agent_id);
        }
      });

      // ---------------- TIME DATA END---------------------------

    }); //END OF COMPUTING LOOP

    //functions working on whole data set

    //Commit computed results to the store
    commit('agentIndexes', agentIndexes);
    commit('clusteredAbmData', abmFilterData);
    commit('abmTimePaths', timePaths);
    commit('activeTimePaths', timePaths);

    console.log(timePaths);

    commit('abmSimpleTimes', simpleTimeData);
    commit('activeAbmSet', abmCore);

    //buildLayers
    dispatch("buildLayers");

    //layer Show/Hide

    // hide loading screen
    commit('resultLoading', false);
    commit('loader', false);
  },
  buildLayers({state, commit, dispatch, rootState}){
    const tripsLayerData = state.activeAbmSet;
    const heatLayerData = state.activeTimePaths;
    const currentTimeStamp = 0
    const heatLayerFormed = [];

    buildTripsLayer(tripsLayerData, currentTimeStamp).then(
      deckLayer => {
        if (rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName)
        }

        // check if scenario is still valid - user input might have changed while loading trips layer
        rootState.map?.addLayer(deckLayer);
        rootState.map?.moveLayer(abmTripsLayerName, "groundfloor");  // add layer on top of the groundfloor layer

        console.log("new trips layer loaded");
        commit('addLayerId', abmTripsLayerName, {root: true});
        commit('animationRunning', true);
        animate(deckLayer, null, null, currentTimeStamp)
      }
    );

    //preparing Data for HeatMap Layer
    Object.entries(heatLayerData).forEach(([key, value]) => {
      Object.entries(heatLayerData[key].values).forEach(([subKey, subValue]) => {
        let coordinate = { c: subKey.split(",").map(Number), w: heatLayerData[key].values[subKey].length };
        heatLayerFormed.push(coordinate);
      })
    });

    buildAggregationLayer(heatLayerFormed, "default").then(
      deckLayer => {
        if (rootState.map?.getLayer(abmAggregationLayerName)) {
          rootState.map?.removeLayer(abmAggregationLayerName)
        }

        console.log("new aggregation layer loaded");
        rootState.map?.addLayer(deckLayer)
        commit('addLayerId', abmAggregationLayerName, {root: true});
        commit('heatMap', true);
        console.log(state.heatMap);
        if (rootState.map?.getLayer("groundfloor")) {
          rootState.map?.moveLayer("abmHeat", "groundfloor")
        }

      });

  },
  updateLayers({state, commit, dispatch, rootState}, layer){
    const range = state.selectedRange;
    const type = state.heatMapType;
    const tripsLayerData = state.activeAbmSet;
    const heatLayerData = state.activeTimePaths;
    const currentTimeStamp = state.currentTimeStamp;
    const heatLayerFormed = [];

    if(layer == "tripsLayer" || layer == "all"){
      buildTripsLayer(tripsLayerData, currentTimeStamp).then(
        deckLayer => {
          if (rootState.map?.getLayer(abmTripsLayerName)) {
            rootState.map?.removeLayer(abmTripsLayerName)
          }

          // check if scenario is still valid - user input might have changed while loading trips layer
          rootState.map?.addLayer(deckLayer);
          rootState.map?.moveLayer(abmTripsLayerName, "groundfloor");  // add layer on top of the groundfloor layer

          console.log("new trips layer loaded");
          commit('addLayerId', abmTripsLayerName, {root: true});
          if(state.animationRunning){
            animate(deckLayer, null, null, currentTimeStamp)
          }
        }
      );
    }

    if(layer == "heatMap" || layer == "all"){
      Object.entries(heatLayerData).forEach(([key, value]) => {

        if(key >= range[0] && key <= range[1]){
          Object.entries(heatLayerData[key].values).forEach(([subKey, subValue]) => {

            heatLayerData[key].values[subKey].forEach((v,i,a) => {
              if(!heatLayerData[key].busyAgents.includes(v)){
                heatLayerData[key].values[subKey].splice(i, 1);
              }
            });

            if(heatLayerData[key].values[subKey].length > 0){
              let coordinate = { c: subKey.split(",").map(Number), w: heatLayerData[key].values[subKey].length };
              heatLayerFormed.push(coordinate);
            } else {
            }
          });
        }
      });

      buildAggregationLayer(heatLayerFormed, type).then(
        deckLayer => {
          if (rootState.map?.getLayer(abmAggregationLayerName)) {
            rootState.map?.removeLayer(abmAggregationLayerName)
          }

          console.log("new aggregation layer loaded");
          rootState.map?.addLayer(deckLayer)
          commit('addLayerId', abmAggregationLayerName, {root: true})
          if (rootState.map?.getLayer("groundfloor")) {
            rootState.map?.moveLayer("abmHeat", "groundfloor")
          }

        });
    }
  },
  filterAbmCore({state, commit, dispatch, rootState}, filterSettings){
      const abmData = state.abmData;
      const timePaths = state.abmTimePaths;
      const filterSet = {...state.clusteredAbmData};
      const spliceArr = [];

      Object.entries(filterSettings).forEach(([key, value]) => {
        if(value === true){
          delete filterSet[key];
        } else {
          filterSet[key].forEach(v => {
            spliceArr.push(v);
          });
        }
      });

      const filteredTimePaths = JSON.parse(JSON.stringify(timePaths));
      console.log(filteredTimePaths);
      const filteredAbm = abmData.filter(v => !spliceArr.includes(v.agent.id));
      Object.entries(filteredTimePaths).forEach(([key, value]) => {
        if(value){
          filteredTimePaths[key].busyAgents = filteredTimePaths[key].busyAgents.filter(v => !spliceArr.includes(v));
        }
      });

      console.log("new Filter Setting applied");
      commit('activeAbmSet', filteredAbm);
      commit('activeTimePaths', filteredTimePaths);
      dispatch('updateLayers', "all");
      commit("loader", false);
  }
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
