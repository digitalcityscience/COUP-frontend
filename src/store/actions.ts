import CircledFeatures from "@/config/circledFeatures.json";
import FocusAreasLayer from "@/config/focusAreas.json";
import { buildingLayerConfigs, getLayerOrder } from "@/config/layers";
import Spaces from "@/config/spaces.json";
import { SourceAndLayerConfig, StoreState } from "@/models";
import { addSourceAndLayerToMap, getUserContentLayerIds, removeSourceAndItsLayersFromMap } from "@/services/map.service";
import CityPyO from "@/store/cityPyO";
import { Layer } from "mapbox-gl";
import { ActionContext } from "vuex";

export default {
  async createDesignLayers({
    state,
    commit,
    dispatch,
  }: ActionContext<StoreState, StoreState>) {
    commit("scenario/loader", true);
    commit("scenario/loaderTxt", "Creating Design Layers ... ");

    /* 
    // TODO add spaces later
    sourceConfigs.push(Spaces.source);
    // @ts-ignore
    layerConfigs.push(Spaces.layer); #
    */

    // iterate over sources in configs
    buildingLayerConfigs.forEach((config : SourceAndLayerConfig) => {
      commit("scenario/loaderTxt", "Getting GeoData from CityPyO ... ");
      state.cityPyO.getLayer(config.source.id, false).then((layerData) => {
        config.source.options.data = layerData
        addSourceAndLayerToMap(config.source, config.layerConfig, state.map)
        commit("scenario/loader", false);
      });
    });
  },
  addSourceToMap(
    { state, commit, dispatch }: ActionContext<StoreState, StoreState>,
    source
  ) {
    if (state.map?.getSource(source.id)) {
      // remove all layers using this source and the source itself
      removeSourceAndItsLayersFromMap(source.id, state.map)
    }
    state.map?.addSource(source.id, source.options);

    return source;
  },
  addLayerToMap(
    { state, commit, dispatch }: ActionContext<StoreState, StoreState>,
    layer: Layer
  ) {
    if (state.map?.getLayer(layer.id)) {
      state.map?.removeLayer(layer.id);
    }
    layer.metadata = "user-content";
    state.map?.addLayer(layer);
    return dispatch("updateLayerOrder");
  },

 // TODO DO THIS IN MAP SERVICE!!
  /** updates the layer order after a layer was added */
  updateLayerOrder({ state, commit, dispatch }) {
    for (const layerName of getLayerOrder()) {
      if (state.map.getLayer(layerName)) {
        //console.log("putting layer on top ", layerName)
        state.map.moveLayer(layerName);
      }
    }
  },
  // TODO DO THIS IN MAP SERVICE!!
  hideAllLayersButThese(
    { state, dispatch, getters },
    layersToShow: string[] = [],
    hideDesignLayers = false
  ) {
    // TODO: design layer names as global variable add in createDesignLayers
    const designLayers = ["spaces", "groundfloor", "upperfloor", "rooftops"];
    if (!hideDesignLayers) {
      layersToShow.push(...designLayers);
    }

    // iterates over all layers and hides them if not excluded
    getters.layerIds.map((layerId) => {
      // not in layers to show
      if (layersToShow.indexOf(layerId) === -1) {
        dispatch("hideLayer", layerId);
      }
    });

    // shows layers in layersToShow
    for (const layerId of layersToShow) {
      dispatch("showLayer", layerId);
    }
  },
  hideLayer({ state }, layerId: string) {
    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, "visibility", "none");
    }
  },
  showLayer({ state }, layerId: string) {
    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, "visibility", "visible");
    }
  },
  editFeatureProps({ state }, feature) {
    if (feature) {
      try {
        const sourceId = feature.layer.source;
        const source = state.map.getSource(sourceId);
        const sourceData = source?._data;
        const sourceFeatures = Array.isArray(sourceData)
          ? sourceData
          : sourceData.features;
        const sourceFeature = sourceFeatures.find(
          (sf) => parseInt(sf.id, 10) === feature.id
        );

        if (sourceFeature && typeof sourceFeature === "object") {
          sourceFeature.properties = feature.properties;
        }
        source.setData(sourceData);
      } catch (e) {
        console.warn("Could not find feature match in raw data", e);
      }
    }
  },
  async connect(
    { state, commit, dispatch }: ActionContext<StoreState, StoreState>,
    options: ConnectionOptions
  ) {
    const cityPyo = new CityPyO();
    const authResponse = await cityPyo.login(options.userdata);

    if (authResponse.authenticated) {
      commit("cityPyO", cityPyo);
    }

    return authResponse;
  },
  addFocusAreasMapLayer({
    state,
    commit,
    dispatch,
  }: ActionContext<StoreState, StoreState>) {
    state.cityPyO.getLayer("focusAreas").then((source) => {
      commit("focusAreasGeoJson", source.options.data);
      dispatch("addSourceToMap", source, { root: true })
        .then((source) => {
          dispatch("addLayerToMap", FocusAreasLayer.layer, { root: true });
        })
        .then(() => {
          state.map.setLayoutProperty(
            FocusAreasLayer.mapSource.data.id,
            "visibility",
            "none"
          );
        });
    });
  },
  updateCircledFeaturesLayer(
    { state, commit, dispatch }: ActionContext<StoreState, StoreState>,
    featureBuffer
  ) {
    const featureCircles = state.featureCircles;

    let bufferIndex = null;
    featureCircles.some((circle, index) => {
      if (
        circle.properties["objectId"] === featureBuffer.properties["objectId"]
      ) {
        bufferIndex = index;
        return true;
      }
    });

    // add or remove current featureBuffer from featureCircles
    if (bufferIndex === null) {
      featureCircles.push(featureBuffer);
    } else {
      featureCircles.splice(bufferIndex, 1);
    }

    // update layer on map
    const source = CircledFeatures.mapSource;
    source.options.data.features = featureCircles;
    dispatch("addSourceToMap", source, { root: true }).then((source) => {
      dispatch("addLayerToMap", CircledFeatures.layer, { root: true });
    });
    commit("featureCircles", featureCircles);
  },

  /***** DO WE STILL NEED THIS?
   /**
   * Parses the module configs to the respective store modules
   * @param {*} state - the module store state
   * @param {*} moduleName - the module to parse the config data to
   * @param {*} [config=Config] - the config.json, defaults to "./config.json"
   * @returns {void}
   *
   parseConfig({state, commit}: ActionContext<StoreState, StoreState>, moduleName: string, config: GenericObject = Config) {
    if (state[moduleName]) {
      const moduleConfig = config?.modules?.[moduleName]

      for (const attr in moduleConfig) {
        try {
          commit(`${moduleName}/${attr}`, moduleConfig[attr])
        } catch (e) {
          state[moduleName][attr] = moduleConfig[attr]
        }
      }
    }
  }
   *****/
};
