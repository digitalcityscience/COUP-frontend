import Amenities from "@/config/abmScenarioSupportLayers/amenitiesLayerConfig";
import Bridges from "@/config/bridges.json";
import SunExposure from "@/config/calculationModuleResults/sunExposureResultConfig";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import PerformanceInfosConfig from "@/config/multiLayerAnalysis/performaceInfosConfig";
import SubSelectionLayerConfig from "@/config/multiLayerAnalysis/subSelectionLayerConfig";
import type { GeoJSON } from "@/models";
import { StoreState } from "@/models";
import {
  addDeckLayerToMap,
  addSourceAndLayerToMap as addSourceAndLayersToMap,
} from "@/services/map.service";
import { bridges as bridgeNames } from "@/store/abm";
import {
  abmAggregationLayerName,
  abmTripsLayerName,
  buildAggregationLayer,
  buildTripsLayer,
} from "@/services/deck.service";
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
  async addSunExposureLayer({
    rootState,
    commit,
  }: ActionContext<StoreState, StoreState>) {
    return rootState.cityPyO.getLayer("sun_exposure").then((result) => {
      commit("sunExposureGeoJson", result);
      SunExposure.source.options.data = result.results;

      addSourceAndLayersToMap(
        SunExposure.source,
        [SunExposure.layerConfig],
        rootState.map
      );
    });
  },
  
  // TODO delete after refactoring bridges
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
    // TODO refactor 
    if (JSON.stringify(state.abmStats) !== JSON.stringify({})) {
      commit("abmStats", {}); // reset abmStats
      commit("amenityStats", {}); // reset amenityStats

    }
    dispatch("updateAmenitiesLayer");

    return // dispatch("initialAbmComputing");
  },
  
  async calculateStatsForMultiLayerAnalysis(): Promise<void> {
    // the timeout just gives time for the commits above to persist and the app to be rerendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    await calculateAmenityStatsForMultiLayerAnalysis().then(() => {
      calcAbmStatsForMultiLayer();
      return;
    });
  },
  // load layer source from cityPyo and add the layer to the map
  updateAmenitiesLayer({ state, commit, dispatch, rootState }, workshopId) {
    // load new data from cityPyo
    const amenitiesLayerName = workshopId || Amenities.source.id;

    return rootState.cityPyO
      .getAbmAmenitiesLayer(amenitiesLayerName, state)
      .then((amenitiesGeoJSON) => {
        console.log("got amenities", amenitiesGeoJSON);
        commit("amenitiesGeoJson", Object.freeze(amenitiesGeoJSON));
        Amenities.source.options.data = amenitiesGeoJSON;
        addSourceAndLayersToMap(
          Amenities.source,
          [Amenities.layerConfig],
          rootState.map
        );
      });
  },
  // load layer source from cityPyo and add the layer to the map
  updateBridgeLayer({ state, commit, dispatch, rootState }, payload) {
    // identify new scenario layer and add it to the map
    const layers = [];
    for (const bridgeName of state.bridges) {
      layers.push(Bridges.layers.filter((layer) => layer.id === bridgeName)[0]);
    }
    if (layers) {
      const source = Bridges.source;
      rootState.cityPyO.getLayer(source.id, false).then((geojson) => {
        source.options.data = geojson;
        addSourceAndLayersToMap(source, layers, rootState.map);
      });
    }
  },
  addMultiLayerAnalysisLayer({ rootState }, features) {
    // update layer on map
    const source = MultiLayerAnalysisConfig.source;
    source.options.data.features = features;
    addSourceAndLayersToMap(
      source,
      [MultiLayerAnalysisConfig.layerConfig],
      rootState.map
    );
  },
  addSubSelectionLayer({ state, commit, dispatch, rootState }, features) {
    // update layer on map
    const source = SubSelectionLayerConfig.source;
    source.options.data.features = features;
    addSourceAndLayersToMap(
      source,
      [SubSelectionLayerConfig.layerConfig],
      rootState.map
    );
  },
  addMultiLayerPerformanceInfos(
    { state, commit, dispatch, rootState },
    features
  ) {
    // update layer on map
    const source = PerformanceInfosConfig.source;
    source.options.data.features = features;
    addSourceAndLayersToMap(
      source,
      [PerformanceInfosConfig.layerConfig],
      rootState.map
    );
  },
  
  // this update the ABM heatmap
  // TODO refactor heatLayerFormed is moved to deckLayer service for now. pass also the timeRange.
  updateAggregationLayer({ state, commit, dispatch, rootState }) {
    const abmTimeRange = state.abmTimeRange;
    const heatLayerData = state.abmTimePaths;
    const heatLayerFormed = [];

    Object.entries(heatLayerData).forEach(([key, _value]) => {
      if (key >= abmTimeRange[0] && key <= abmTimeRange[1]) {
        Object.entries(heatLayerData[key].values).forEach(
          ([subKey, _subValue]) => {
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
      addDeckLayerToMap(deckLayer, rootState.map);
      console.log("new aggregation layer loaded");
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
