import SunExposure from "@/config/calculationModuleResults/sunExposureResultConfig";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import PerformanceInfosConfig from "@/config/multiLayerAnalysis/performaceInfosConfig";
import SubSelectionLayerConfig from "@/config/multiLayerAnalysis/subSelectionLayerConfig";
import { StoreState } from "@/models";
import { addSourceAndLayerToMap as addSourceAndLayersToMap } from "@/services/map.service";

import { calcAbmStatsForMultiLayer } from "@/store/scenario/abmStats";
import { calculateAmenityStatsForMultiLayerAnalysis } from "@/store/scenario/amenityStats";
import { ActionContext } from "vuex";
export default {
  async addSunExposureLayer({
    rootState,
    commit,
  }: ActionContext<StoreState, StoreState>) {
    return rootState.cityPyO.getLayer("sun_exposure").then((result) => {
      commit("sunExposureGeoJson", result.results);
      SunExposure.source.options.data = result.results;

      addSourceAndLayersToMap(
        SunExposure.source,
        SunExposure.layerConfigs,
        rootState.map
      );
    });
  },

  async calculateStatsForMultiLayerAnalysis(): Promise<void> {
    // the timeout just gives time for the commits above to persist and the app to be rerendered
    await new Promise((resolve) => setTimeout(resolve, 500));

    await calculateAmenityStatsForMultiLayerAnalysis().then(() => {
      calcAbmStatsForMultiLayer();
      return;
    });
  },

  addMultiLayerAnalysisLayer({ rootState }, features) {
    // update layer on map
    const source = MultiLayerAnalysisConfig.source;
    source.options.data.features = features;
    addSourceAndLayersToMap(
      source,
      MultiLayerAnalysisConfig.layerConfigs,
      rootState.map
    );
  },
  addSubSelectionLayer({ state, commit, dispatch, rootState }, features) {
    // update layer on map
    const source = SubSelectionLayerConfig.source;
    source.options.data.features = features;
    addSourceAndLayersToMap(
      source,
      SubSelectionLayerConfig.layerConfigs,
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
      PerformanceInfosConfig.layerConfigs,
      rootState.map
    );
  },
};
