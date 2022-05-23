import CircledFeatures from "@/config/userInteraction/circledFeaturesLayerConfig";
import FocusAreasLayerConfig from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import { buildingLayersConfigs } from "@/config/urbanDesignLayers/buildingLayersConfigs";
import LandscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";
import { SourceAndLayerConfigs, StoreState } from "@/models";
import { addSourceAndLayerToMap, hideBuildingUseColors, hideLayers } from "@/services/map.service";
import CityPyO from "@/store/cityPyO";
import { ActionContext } from "vuex";

export default {
  async createDesignLayers({ state }: ActionContext<StoreState, StoreState>) {
    const designConfigs = [...buildingLayersConfigs, LandscapeLayerConfig];
    // iterate over sources in configs
    designConfigs.forEach((config: SourceAndLayerConfigs) => {
      // get layer data from cityPyo
      state.cityPyO.getLayer(config.source.id).then((layerData) => {
        // merge layer data and config
        config.source.options.data = layerData;
        // add to map
        addSourceAndLayerToMap(config.source, config.layerConfigs, state.map);
        // hide highlighted building layers by default
        hideBuildingUseColors(state.map) 
      });
    });
  },
  addFocusAreasMapLayer({
    state,
    commit,
  }: ActionContext<StoreState, StoreState>) {
    // get layer data from cityPyo
    state.cityPyO.getLayer("focusAreas").then((geojson) => {
      commit("focusAreasGeoJson", geojson);
      // merge layer data and config
      FocusAreasLayerConfig.source.options.data = geojson;
      // add to map
      addSourceAndLayerToMap(
        FocusAreasLayerConfig.source,
        FocusAreasLayerConfig.layerConfigs,
        state.map
      );
      hideLayers(
        state.map,
        FocusAreasLayerConfig.layerConfigs.map((conf) => {return conf.id})
      );
    });
  },
  // TODO do this in layer service?
  // eigentlich musst du nur den highlighted layer anzeigen.

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
    addSourceAndLayerToMap(source, CircledFeatures.layerConfigs, state.map);
    commit("featureCircles", featureCircles);
  },
};
