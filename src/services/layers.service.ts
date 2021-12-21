import store from "@/store";


/* export function createDesignLayers() {
    commit("scenario/loader", true);
    commit("scenario/loaderTxt", "Creating Design Layers ... ");

    const designConfigs = [...buildingLayerConfigs, landscapeLayerConfig];
    
    // iterate over sources in configs
    designConfigs.forEach((config : SourceAndLayerConfig) => {
      commit("scenario/loaderTxt", "Getting GeoData from CityPyO ... ");
      state.cityPyO.getLayer(config.source.id, false).then((layerData) => {
        config.source.options.data = layerData
        addSourceAndLayerToMap(config.source, config.layerConfig, state.map)
        commit("scenario/loader", false);
      });
    });
} */