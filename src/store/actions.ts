import CircledFeatures from "@/config/circledFeatures.json";
import FocusAreasLayerConfig from "@/config/focusAreas.json";
import { buildingLayerConfigs, landscapeLayerConfig, getLayerOrder } from "@/config/layers";
import {  SourceAndLayerConfig, StoreState } from "@/models";
import { addSourceAndLayerToMap } from "@/services/map.service";
import CityPyO from "@/store/cityPyO";
import { Layer } from "mapbox-gl";
import { ActionContext } from "vuex";

export default {
  async createDesignLayers({
    state,
    commit,
  }: ActionContext<StoreState, StoreState>) { 
    commit("scenario/loader", true);
    commit("scenario/loaderTxt", "Creating Design Layers ... ");

    const designConfigs = [...buildingLayerConfigs, landscapeLayerConfig];
    // iterate over sources in configs
    designConfigs.forEach((config : SourceAndLayerConfig) => {
    // get layer data from cityPyo
      state.cityPyO.getLayer(config.source.id).then((layerData) => {
        // merge layer data and config
        config.source.options.data = layerData
        // add to map
        addSourceAndLayerToMap(config.source, [config.layerConfig], state.map)
      });
    });
    // finally remove loading screen
    commit("scenario/loader", false);
  },
  addFocusAreasMapLayer({
    state,
    commit,
  }: ActionContext<StoreState, StoreState>) {
    // get layer data from cityPyo
    state.cityPyO.getLayer("focusAreas").then((geojson) => {
      commit("focusAreasGeoJson", geojson);
      // merge layer data and config
      FocusAreasLayerConfig.source.options.data = geojson
      // add to map
      addSourceAndLayerToMap(FocusAreasLayerConfig.source, [FocusAreasLayerConfig.layerConfig], state.map)
    });
  },
  // TODO do this in layer service?
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
    const source = CircledFeatures.source;
    source.options.data.features = featureCircles;
    addSourceAndLayerToMap(source, [CircledFeatures.layerConfig], state.map)
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
