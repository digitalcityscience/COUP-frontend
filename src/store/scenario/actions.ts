import Amenities from "@/config/amenities.json";
import Bridges from "@/config/bridges.json";
import { swLayerName } from "@/config/layers";
import SubSelectionLayerConfig from "@/config/layerSubSelection.json";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis.json";
import NoiseLayer from "@/config/noise.json";
import PerformanceInfosConfig from "@/config/performanceInfos.json";
import SunExposure from "@/config/sunExposureResult.json";
import TrafficCountLayer from "@/config/trafficCounts.json";
import Trees from "@/config/trees.json";
import WindResult from "@/config/windResult.json";
import { StoreState } from "@/models";
import { buildSWLayer } from "@/services/deck.service";
import { bridges as bridgeNames, bridgeVeddelOptions } from "@/store/abm";
import * as calculationModules from "@/services/calculationModules.service";
import {
  abmAggregationLayerName,
  abmTripsLayerName,
  animate,
  buildAggregationLayer,
  buildTripsLayer,
} from "@/store/deck-layers";
import {
  calcAbmStatsForMultiLayer,
  calculateAbmStatsForFocusArea,
} from "@/store/scenario/abmStats";
import {
  calculateAmenityStatsForFocusArea,
  calculateAmenityStatsForMultiLayerAnalysis,
} from "@/store/scenario/amenityStats";
import { ActionContext } from "vuex";
export default {
  async updateNoiseScenario(
    { state, commit, dispatch, rootState },
    noiseScenario
  ) {
    const { userid } = rootState.cityPyO;

    return new Promise((resolve, reject) => {
      // request calculation and fetch results
      calculationModules.requestCalculationNoise(
        noiseScenario,
        userid
        )
        .then((noiseResultUuid) => {
          return calculationModules.getResultForNoise(
            noiseResultUuid
          );
        })
        .then((noiseResult) => {
          // adding result to store
          commit(
            "currentNoiseGeoJson",
            Object.freeze(noiseResult.source.options.data)
          );
          // adding result to map
          dispatch("addSourceToMap", noiseResult.source, { root: true })
            .then((noiseResultSource) => {
              dispatch("addLayerToMap", NoiseLayer.layer, { root: true });
              dispatch("addTrafficCountLayer");
            })
            .then((response) => {
              return resolve(response);
            })
            .catch((error) => {
              console.log("error when getting results");
              return reject(error);
            });
        });
    });
  },
  async addTrafficCountLayer({ state, commit, dispatch, rootState }) {
    // check if traffic counts already in store, otherwise load them from cityPyo
    const scenarioTraffic =
      JSON.parse(JSON.stringify(state.trafficCounts)) ||
      (await rootState.cityPyO
        .getLayer("trafficCounts", false)
        .then((trafficData) => {
          commit("trafficCounts", trafficData);
          return JSON.parse(JSON.stringify(trafficData));
        }));

    const trafficPercent = state.noiseScenario.traffic_quota;
    scenarioTraffic["features"].forEach((point) => {
      const carTrafficDaily = Math.floor(
        point["properties"]["car_traffic_daily"] * trafficPercent
      );
      const truckTrafficDaily = Math.floor(
        point["properties"]["truck_traffic_daily"] * trafficPercent
      );
      point["properties"]["car_traffic_daily"] = carTrafficDaily;
      point["properties"]["truck_traffic_daily"] = truckTrafficDaily;
      point["properties"]["description"] =
        "Cars: " + carTrafficDaily + " Trucks: " + truckTrafficDaily;
    });

    const source = {
      id: TrafficCountLayer.mapSource.data.id,
      options: {
        type: "geojson",
        data: scenarioTraffic,
      },
    };
    return dispatch("addSourceToMap", source, { root: true }).then((source) => {
      return dispatch("addLayerToMap", TrafficCountLayer.layer, { root: true });
    });
  },
  addSunExposureLayer({
    state,
    rootState,
    commit,
    dispatch,
  }: ActionContext<StoreState, StoreState>) {
    return rootState.cityPyO.getLayer("sun_exposure").then((source) => {
      commit("sunExposureGeoJson", source.options.data);
      return dispatch("addSourceToMap", source, { root: true }).then(
        (source) => {
          return dispatch("addLayerToMap", SunExposure.layer, { root: true });
        }
      );
    });
  },
  // load layer source from cityPyo and add the layer to the map
  // Todo : isnt there a way to update the source data without reinstanciating the entire layer?
  async updateWindLayer(
    { state, commit, dispatch, rootState },
    wind_scenario
  ): Promise<void> {
    console.debug("updating wind!");
    const { userid } = rootState.cityPyO;
    wind_scenario["city_pyo_user"] = userid;
    // fetch results, add to map and return boolean whether results are complete or not
    const windResultUuid = await calculationModules.requestCalculationWind(
      wind_scenario,
      userid
    );
    console.debug("wind result uuid", windResultUuid);
    const completed = await calculationModules
      .getResultForWind(windResultUuid)
      .then((resultInfo) => {
        console.log("end result", resultInfo);

        const receivedCompleteResult = resultInfo.complete || false; // was the result complete?
        const source = resultInfo.source;

        // results are new if they contain more features than the known result
        const newResults =
          !state.windResultGeoJson ||
          source.options.data.features.length >
            state.windResultGeoJson["features"].length;

        if (receivedCompleteResult || newResults) {
          // todo use timestamP??
          // received an updated result
          source.id = "wind";
          commit("windResultGeoJson", Object.freeze(source.options.data));
          dispatch("addSourceToMap", source, { root: true }).then((source) => {
            dispatch("addLayerToMap", WindResult.layer, { root: true });
          });
        }
        return receivedCompleteResult;
      });

    if (!completed) {
      // keep fetching new results until the results are complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
      dispatch("updateWindLayer", wind_scenario);
    }
  },
  // TODO: how do we realize 1 central function for all users?
  loadScienceCityAbmScenario(
    { state, commit, dispatch, rootState },
    scenarioId: string
  ) {
    //show loading screen
    commit("resultLoading", true);
    commit("loader", true);

    rootState.cityPyO.getLayer(scenarioId, false).then((result) => {
      if (!result) {
        alert(
          "There was an error requesting the data from the server. Please get in contact with the admins."
        );
        //remove loading screen
        commit("resultLoading", false);
        return;
      }

      commit("loaderTxt", "Serving Abm Data ... ");
      return dispatch("computeLoop", result.data);
    });

    // TODO dispatch("updateAmenitiesLayer", scenarioId);
  },
  // TODO: adapt to new abm model with underpass_veddel_north and new results!
  loadWorkshopScenario({ state, commit, dispatch, rootState }, scenarioId) {
    const bridges = updateBridges(
      bridgeNames.bridge_hafencity,
      bridgeVeddelOptions.diagonal
    );

    commit("bridges", bridges);
    dispatch("updateBridgeLayer");
    dispatch("initialAbmComputing", scenarioId);
    dispatch("updateAmenitiesLayer", scenarioId);
  },
  updateAbmDesignScenario({ state, commit, dispatch, rootState }) {
    /*    // reset all abm data
    commit("abmTrips", null)
    commit("agentIndexes", null)
    commit("activeAbmSet", null)   // same as abmDat}
    commit("abmObject", null)
    commit("abmTimePaths", null)
    commit("abmS  impleTimes", null)
    commit("abmWeightCount", null)
    commit("updateAbmStatsChart", false)
    commit("updateAmenityStatsChart", false)
    */

    const bridges = updateBridges(
      state.moduleSettings.bridge_hafencity,
      state.moduleSettings.underpass_veddel_north
    );

    commit("bridges", bridges);
    dispatch("updateBridgeLayer");

    // reset abmStats
    if (JSON.stringify(state.abmStats) !== JSON.stringify({})) {
      commit("abmStats", {}); // reset abmStats
      commit("amenityStats", {}); // reset amenityStats
      commit("abmMultiLayerStats", {}); // reset abmStats
      commit("amenityStatsMultiLayer", {}); // reset amenityStats
    }
    dispatch("updateAmenitiesLayer");

    return dispatch("initialAbmComputing");
  },
  calculateStatsForGrasbrook({ state, commit, dispatch, rootState }) {
    calculateAmenityStatsForFocusArea();
    calculateAbmStatsForFocusArea();
  },
  showLoadingScreen(
    { state, commit, dispatch, rootState },
    message = "loading"
  ) {
    // TODO: is this still needed?
  },
  async calculateStatsForMultiLayerAnalysis({
    state,
    commit,
    dispatch,
    rootState,
  }) {
    commit("resultLoading", true);
    commit("loader", true);
    commit("loaderTxt", "Calculating statistics for each focus area (slow)");

    // the timeout just gives time for the commits above to persist and the app to be rerendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    calculateAmenityStatsForMultiLayerAnalysis().then(() => {
      calcAbmStatsForMultiLayer().then(() => {
        commit("resultLoading", false);
        commit("loader", false);
        commit("loaderTxt", "loading");
      });
    });
  },
  // load layer source from cityPyo and add the layer to the map
  updateAmenitiesLayer({ state, commit, dispatch, rootState }, workshopId) {
    // load new data from cityPyo
    const amenitiesLayerName = workshopId || Amenities.mapSource.data.id;

    return rootState.cityPyO
      .getAbmAmenitiesLayer(amenitiesLayerName, state)
      .then((source) => {
        console.log("got amenities", source);
        commit("amenitiesGeoJson", Object.freeze(source.options.data));
        return dispatch("addSourceToMap", source, { root: true }).then(
          (source) => {
            return dispatch("addLayerToMap", Amenities.layer, { root: true });
          }
        );
      });
  },
  // load layer source from cityPyo and add the layer to the map
  updateBridgeLayer({ state, commit, dispatch, rootState }, payload) {
    // delete any bridge layer that is still on the map, before adding a new one

    // TODO this part can be deleted?? is already moved when calling "addSourceToMap"
    Bridges.layers.forEach((layer) => {
      if (rootState.map?.getSource(layer.source)) {
        dispatch("removeSourceFromMap", layer.source, { root: true });
      }
    });
    // identify new scenario layer and add it to the map
    const layers = [];
    for (const bridgeName of state.bridges) {
      console.log("bridgeToCheck", bridgeName);
      layers.push(Bridges.layers.filter((layer) => layer.id === bridgeName)[0]);
    }
    console.log("found layers", layers);
    if (layers) {
      const mapSource = Bridges.mapSource;
      rootState.cityPyO.getLayer(mapSource.data.id).then((source) => {
        dispatch("addSourceToMap", source, { root: true }).then((source) => {
          layers.forEach((layer) => {
            dispatch("addLayerToMap", layer, { root: true });
          });
        });
      });
    }
  },
  addMultiLayerAnalysisLayer({ state, commit, dispatch, rootState }, features) {
    // update layer on map
    const source = MultiLayerAnalysisConfig.mapSource;
    source.options.data.features = features;
    return dispatch("addSourceToMap", source, { root: true }).then((source) => {
      return dispatch("addLayerToMap", MultiLayerAnalysisConfig.layer, {
        root: true,
      });
    });
  },
  addSubSelectionLayer({ state, commit, dispatch, rootState }, features) {
    // update layer on map
    const source = SubSelectionLayerConfig.mapSource;
    source.options.data.features = features;
    dispatch("addSourceToMap", source, { root: true }).then((source) => {
      dispatch("addLayerToMap", SubSelectionLayerConfig.layer, { root: true });
    });
  },
  addMultiLayerPerformanceInfos(
    { state, commit, dispatch, rootState },
    features
  ) {
    // update layer on map
    const source = PerformanceInfosConfig.mapSource;
    source.options.data.features = features;
    dispatch("addSourceToMap", source, { root: true }).then((source) => {
      dispatch("addLayerToMap", PerformanceInfosConfig.layer, { root: true });
    });
  },
  //LOADING INITIAL ABM DATA
  initialAbmComputing(
    { state, commit, dispatch, rootState },
    workshopScenario
  ) {
    //show loading screen
    commit("resultLoading", true);
    commit("loader", true);

    //check if special workshop Scenario should be loaded
    const scenarioName = workshopScenario || abmTripsLayerName;

    //LOAD DATA FROM CITYPYO
    commit("loaderTxt", "Getting ABM Simulation Data from CityPyO ... ");
    return rootState.cityPyO
      .getAbmResultLayer(scenarioName, state)
      .then((result) => {
        if (!result) {
          alert(
            "There was an error requesting the data from the server. Please get in contact with the admins."
          );
          //remove loading screen
          commit("resultLoading", false);
          return;
        }

        commit("loaderTxt", "Serving Abm Data ... ");
        return dispatch("computeLoop", result.options?.data).then(
          dispatch("calculateStatsForGrasbrook")
        );
      });
  },
  //compute ABM Data Set
  computeLoop({ state, commit, dispatch, rootState }, abmCore: any[]) {
    const agentIndexes = {};
    const timePaths = [];
    const simpleTimeData = {};
    const trips = [];

    console.log("abmCore size: ", abmCore?.length);
    //go through each agent inside the abm set (agent, index, array)

    commit("loaderTxt", "Clustering ABM Data for functional purposes ... ");
    abmCore.forEach((who, index, array) => {
      const agent_id = who.agent.id;

      // #0 create a simple lookup with all agent id's and their index in the abmCore
      agentIndexes[agent_id] = index;

      // #1 create a bin with data on trips each agent makes (origin, destination, pathIndexes, duration, length)
      if (who.trips) {
        for (const trip of who.trips) {
          // trip has following information {"agent", "origin", "destination", "length", "duration", "pathIndexes" }
          trip["agent"] = agent_id;
          trips.push(trip);
        }
      }

      // #2 Clustering TIME DATA for Aggregation Layer
      // ---------------- TIME DATA ------------------------------
      // TODO refactor!!!
      commit("loaderTxt", "Analyzing Time Data ... ");
      who.timestamps.forEach((v, i, a) => {
        /*round timestamps to full hours*/
        const h = Math.floor(v / 3600) + 8;
        /*create object keys from full hours*/
        timePaths[h] = timePaths[h] || {};
        timePaths[h].busyAgents = timePaths[h].busyAgents || [];
        timePaths[h].values = timePaths[h].values || {};
        timePaths[h].stamps = timePaths[h].stamps + 1 || 1;
        const coords = who.path[i].toString();

        timePaths[h].values[coords] = timePaths[h].values[coords] || [];
        //timePaths[h].values[coords].agents = timePaths[h].values[coords].agents || [agent_id];
        if (!timePaths[h].values[coords].includes(agent_id))
          timePaths[h].values[coords].push(agent_id);
        //timePaths[h].values[coords].weight = timePaths[h].values[coords].agents.length;

        /*simpleTimeData[v] = simpleTimeData[v] || [];
        simpleTimeData[v].push(agent_id);*/

        // TODO 300 ?? what is 300??

        commit("loaderTxt", "Creating Simple Time Data Arrays ... ");
        simpleTimeData[Math.floor(v / 300) * 300] =
          simpleTimeData[Math.floor(v / 300) * 300] || {};
        simpleTimeData[Math.floor(v / 300) * 300]["all"] =
          simpleTimeData[Math.floor(v / 300) * 300]["all"] || [];
        simpleTimeData[Math.floor(v / 300) * 300][who.agent.mode] =
          simpleTimeData[Math.floor(v / 300) * 300][who.agent.mode] || [];
        simpleTimeData[Math.floor(v / 300) * 300][who.agent.agent_age] =
          simpleTimeData[Math.floor(v / 300) * 300][who.agent.agent_age] || [];
        simpleTimeData[Math.floor(v / 300) * 300][
          who.agent.resident_or_visitor
        ] =
          simpleTimeData[Math.floor(v / 300) * 300][
            who.agent.resident_or_visitor
          ] || [];
        simpleTimeData[Math.floor(v / 300) * 300]["all"].push(agent_id);
        simpleTimeData[Math.floor(v / 300) * 300][who.agent.mode].push(
          agent_id
        );
        simpleTimeData[Math.floor(v / 300) * 300][who.agent.agent_age].push(
          agent_id
        );
        simpleTimeData[Math.floor(v / 300) * 300][
          who.agent.resident_or_visitor
        ].push(agent_id);

        commit("loaderTxt", "Creating Busy Agents ... ");
        if (i == 0) {
          timePaths[h].busyAgents.push(agent_id);
        }
      });

      // ---------------- TIME DATA END---------------------------
    }); //END OF COMPUTING LOOP

    //functions working on whole data set

    //Commit computed results to the store
    commit("agentIndexes", Object.freeze(agentIndexes));
    commit("abmTimePaths", Object.freeze(timePaths));
    commit("abmTrips", Object.freeze(trips));

    console.log("trips size: ", trips?.length);
    console.log("timePaths size: ", timePaths?.length);

    commit("abmSimpleTimes", Object.freeze(simpleTimeData));
    commit("activeAbmSet", Object.freeze(abmCore));

    //buildLayers
    return dispatch("buildLayers").then(
      // hide loading screen
      commit("resultLoading", false),
      commit("loader", false)
    );
  },
  buildLayers({ state, commit, dispatch, rootState }) {
    const tripsLayerData = state.activeAbmSet;
    const heatLayerData = state.abmTimePaths;
    const currentTimeStamp = 0;
    const heatLayerFormed = [];

    buildTripsLayer(tripsLayerData, currentTimeStamp).then((deckLayer) => {
      if (rootState.map?.getLayer(abmTripsLayerName)) {
        rootState.map?.removeLayer(abmTripsLayerName);
      }

      // check if scenario is still valid - user input might have changed while loading trips layer
      dispatch("addLayerToMap", deckLayer, { root: true }).then(() => {
        commit("addLayerId", abmAggregationLayerName, { root: true });
      });
      console.log("new trips layer loaded");
      commit("addLayerId", abmTripsLayerName, { root: true });
      commit("animationRunning", true);
      animate(deckLayer, null, null, currentTimeStamp);
    });

    //preparing Data for HeatMap Layer
    Object.entries(heatLayerData).forEach(([key, value]) => {
      Object.entries(heatLayerData[key].values).forEach(
        ([subKey, subValue]) => {
          const coordinate = {
            c: subKey.split(",").map(Number),
            w: heatLayerData[key].values[subKey].length,
          };
          heatLayerFormed.push(coordinate);
        }
      );
    });

    return buildAggregationLayer(heatLayerFormed).then((deckLayer) => {
      if (rootState.map?.getLayer(abmAggregationLayerName)) {
        rootState.map?.removeLayer(abmAggregationLayerName);
      }

      console.log("new aggregation layer loaded");
      dispatch("addLayerToMap", deckLayer, { root: true }).then(() => {
        commit("addLayerId", abmAggregationLayerName, { root: true });
      });
      commit("heatMap", true);
      console.log(state.heatMap);
    });
  },
  // this updates ABM related layers only
  updateLayers({ state, commit, dispatch, rootState }, layer) {
    const abmTimeRange = state.abmTimeRange;
    const tripsLayerData = state.activeAbmSet;
    const heatLayerData = state.abmTimePaths;
    const currentTimeStamp = state.currentTimeStamp;
    const heatLayerFormed = [];

    if (layer == "tripsLayer" || layer == "all") {
      buildTripsLayer(tripsLayerData, currentTimeStamp).then((deckLayer) => {
        if (rootState.map?.getLayer(abmTripsLayerName)) {
          rootState.map?.removeLayer(abmTripsLayerName);
        }

        // check if scenario is still valid - user input might have changed while loading trips layer
        // ----> is this comment still at the right place??
        dispatch("addLayerToMap", deckLayer, { root: true }).then(() => {
          commit("addLayerId", abmTripsLayerName, { root: true });
          console.log("new trips layer loaded");
        });
        if (state.animationRunning) {
          animate(deckLayer, null, null, currentTimeStamp);
        }
      });
    }

    if (layer == "heatMap" || layer == "all") {
      Object.entries(heatLayerData).forEach(([key, value]) => {
        if (key >= abmTimeRange[0] && key <= abmTimeRange[1]) {
          Object.entries(heatLayerData[key].values).forEach(
            ([subKey, subValue]) => {
              heatLayerData[key].values[subKey].forEach((v, i, a) => {
                if (!heatLayerData[key].busyAgents.includes(v)) {
                  heatLayerData[key].values[subKey].splice(i, 1);
                }
              });

              if (heatLayerData[key].values[subKey].length > 0) {
                const coordinate = {
                  c: subKey.split(",").map(Number),
                  w: heatLayerData[key].values[subKey].length,
                };
                heatLayerFormed.push(coordinate);
              }
            }
          );
        }
      });

      buildAggregationLayer(heatLayerFormed).then((deckLayer) => {
        if (rootState.map?.getLayer(abmAggregationLayerName)) {
          rootState.map?.removeLayer(abmAggregationLayerName);
        }
        console.log("new aggregation layer loaded");
        dispatch("addLayerToMap", deckLayer, { root: true }).then(() => {
          commit("addLayerId", abmAggregationLayerName, { root: true });
        });
      });
    }
  },
  async transformSWLayerData({ state, commit, dispatch, rootState }) {
    const deckLayer = buildSWLayer(
      rootState.stormwater.result.geojson,
      state.rainTime
    );
    console.info("stormwater layer loaded");
    await dispatch("addLayerToMap", deckLayer, { root: true });
  },
  async addSWLayer({ state, commit, dispatch, rootState }) {
    dispatch("transformSWLayerData");
    console.log("adding trees", Trees.source, Trees.layer);

    // add trees
    rootState.cityPyO.getLayer(Trees.source.data.id).then((source) => {
      dispatch("addSourceToMap", source, { root: true }).then(() => {
        dispatch("addLayerToMap", Trees.layer, { root: true }).then(() => {
          // hide tree layer for now
          dispatch("hideAllLayersButThese", [swLayerName], { root: true });
        });
      });
    });
  },
};

function updateBridges(bridge_hafencity, underpass_veddel) {
  const bridges = [bridgeNames.bridge_veddel_horizontal]; // always there

  if (bridge_hafencity) {
    bridges.push(bridgeNames.bridge_hafencity);
  }
  if (underpass_veddel) {
    bridges.push(bridgeNames.underpass_veddel_north);
  }

  return bridges;
}

function isNoiseScenarioMatching(noiseDataSet, noiseScenario) {
  return (
    noiseDataSet["noise_scenario"]["traffic_quota"] ==
      noiseScenario.traffic_quota &&
    noiseDataSet["noise_scenario"]["max_speed"] == noiseScenario.max_speed
  );
}
