import Buildings from '@/config/buildings.json'
import Spaces from '@/config/spaces.json'
import CityPyO from '@/store/cityPyO'
import {ActionContext} from 'vuex'
import {Layer} from 'mapbox-gl'
import CityPyODefaultUser from "@/config/cityPyoDefaultUser.json";
import FocusAreasLayer from "@/config/focusAreas.json";
import CircledFeatures from "@/config/circledFeatures.json";
import {getLayerOrder} from "@/config/layers.ts"

export default {
  async createDesignLayers({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
    commit("scenario/loader", true);
    commit("scenario/loaderTxt", "Creating Design Layers ... ");
    const sourceConfigs = Buildings.sources || [];
    const layerConfigs = Buildings.layers || [];
    sourceConfigs.push(Spaces.source)
    // @ts-ignore
    layerConfigs.push(Spaces.layer)

    const loadLayers = new Promise(resolve => {
      let designLayersLoaded = 0;
      // iterate over sources in configs
      sourceConfigs.forEach(source => {
        //console.log("hans", source.id)
        // if the data should be loaded from city IO
        if (source.data?.from === "cityPyO") {
          commit("scenario/loaderTxt", "Getting GeoData from CityPyO ... ");
          state.cityPyO.getLayer(source.data.id)
            .then(source => {
              dispatch('addSourceToMap', source).then(source => {
                // add all layers using this source
                layerConfigs
                  .filter(l => l.source === source.id)
                  .forEach(l => {
                    dispatch('addLayerToMap', l).then(() => {
                      designLayersLoaded += 1;
                      commit("scenario/loaderTxt", "Design Layer #" + designLayersLoaded + " successfully loaded ... ");
                      if (designLayersLoaded >= layerConfigs.length) {
                        resolve()
                      }
                    })
                  })
              })
            })
        } else {
          console.warn("do not know where to load source data from", source)
        }
      })
    })

    await loadLayers;
    commit("scenario/loader", false);
    return
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
    dispatch("updateLayerOrder")
  },
  /** updates the layer order after a layer was added */
  updateLayerOrder({state, commit, dispatch}) {
    for (const layerName of getLayerOrder()) {
      if (state.map.getLayer(layerName)) {
        //console.log("putting layer on top ", layerName)
        state.map.moveLayer(layerName)
      }
    }
  },
  hideAllLayersButThese(
    {state, dispatch},
    layersToShow: string[] = [],
    hideDesignLayers: boolean = false
  ) {
    // TODO: design layer names as global variable add in createDesignLayers
    const designLayers = ['spaces', 'groundfloor', 'upperfloor', 'rooftops']
    if (!hideDesignLayers) {
      layersToShow.push(...designLayers)
    }

    // iterates over all layers and hides them if not excluded
    for (const layerId of state.layerIds) {
      // not in layers to show
      if (layersToShow.indexOf(layerId) === -1) {
        dispatch('hideLayer', layerId)
      }
    }
    // shows layers in layersToShow
    for (const layerId of layersToShow) {
      dispatch('showLayer', layerId)
    }
  },
  hideLayer({state}, layerId: string) {
    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, 'visibility', 'none');
    }
  },
  showLayer({state}, layerId: string) {
    if (state.map.getLayer(layerId)) {
      state.map.setLayoutProperty(layerId, 'visibility', 'visible');
    }
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
  async connect({state, commit, dispatch}: ActionContext<StoreState, StoreState>, options: ConnectionOptions) {
    const cityPyo = new CityPyO()
    commit('cityPyO', cityPyo)

    return await cityPyo.login(options.userdata)
  },
  addFocusAreasMapLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>){
    state.cityPyO.getLayer("focusAreas").then(source => {
        commit('focusAreasGeoJson', source.options.data)
        dispatch('addSourceToMap', source, {root: true})
          .then(source => {
            dispatch('addLayerToMap', FocusAreasLayer.layer, {root: true})
          }).then(() => {
          state.map.setLayoutProperty(FocusAreasLayer.mapSource.data.id, 'visibility', 'none');
        })
      }
    )
  },
  updateCircledFeaturesLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>, featureBuffer) {
    let featureCircles = state.featureCircles

    let bufferIndex = null
    featureCircles.some((circle, index) => {
      if (circle.properties["objectId"] === featureBuffer.properties["objectId"]) {
        bufferIndex = index
        return true
      }
    })

     // add or remove current featureBuffer from featureCircles
     if (bufferIndex === null) {
       featureCircles.push(featureBuffer)
     } else {
       featureCircles.splice(bufferIndex, 1);
     }

     // update layer on map
      let source = CircledFeatures.mapSource
      source.options.data.features = featureCircles
      dispatch('addSourceToMap', source, {root: true})
        .then(source => {
          dispatch('addLayerToMap', CircledFeatures.layer, {root: true})
        })
      commit('featureCircles', featureCircles)
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
}
