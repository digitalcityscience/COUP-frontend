import Designs from '@/config/designs.json'
import CityPyO from '@/store/cityPyO'
import {ActionContext} from 'vuex'
import {Layer} from 'mapbox-gl'


export default {
  createDesignLayers({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
    const sourceConfigs = Designs.sources || [];
    // iterate over sources in configs
    sourceConfigs.forEach(source => {
      // if the data should be loaded from city IO
      if (source.data?.from === "cityPyO") {
        state.cityPyO.getLayer(source.data.id)
          .then(source => {
            dispatch('addSourceToMap', source).then(source => {
              // add all layers using this source
              Designs.layers
                .filter(l => l.source === source.id)
                .forEach(l => {
                  dispatch('addLayerToMap', l)
                })
            })
          })
      } else {
        console.warn("do not know where to load source data from", source)
      }
    })
  },
  addSourceToMap({state, commit, dispatch}: ActionContext<StoreState, StoreState>, source) {
    if (state.map?.getSource(source.id)) {
      // remove all layers using this source and the source itself
      dispatch('removeSourceFromMap', source.id)
    }
    state.map?.addSource(source.id, source.options)

    return source
  },
  removeSourceFromMap({state, commit, dispatch}: ActionContext<StoreState, StoreState>, sourceId) {
    console.log("remove source from map", sourceId)

    if (state.map?.getSource(sourceId)) {
      // remove all layers using this source
      state.layerIds.forEach(layerId => {
          if (state.map?.getLayer(layerId)
            && state.map?.getLayer(layerId).source === sourceId) {
            state.map?.removeLayer(layerId)
            commit('removeLayerId', layerId)
          }
        }
      )
      state.map?.removeSource(sourceId)
    }
  },
  addLayerToMap({state, commit, dispatch}: ActionContext<StoreState, StoreState>, layer) {
    if (state.map?.getLayer(layer.id)) {
      commit('removeLayerId', layer.id)
      state.map?.removeLayer(layer.id)
    }
    state.map?.addLayer(layer as Layer)
    commit('addLayerId', layer.id)
  },
  editFeatureProps({state}, feature) {
    if (feature) {
      try {
        const sourceId = feature.layer.source
        const source = state.map.getSource(sourceId)
        const sourceData = source?._data
        const sourceFeatures = Array.isArray(sourceData) ? sourceData : sourceData.features
        const sourceFeature = sourceFeatures.find(sf => parseInt(sf.id, 10) === feature.id)

        sourceFeature.properties = feature.properties
        source.setData(sourceData)
      } catch (e) {
        console.warn('Could not find feature match in raw data', e)
      }
    }
  },
  connect({commit}: ActionContext<StoreState, StoreState>, options: ConnectionOptions) {
    commit('cityPyO', new CityPyO(options.userdata))
  }

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
}
