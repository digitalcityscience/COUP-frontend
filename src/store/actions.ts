import Designs from '@/config/designs.json'
import CityPyO from '@/store/cityPyO'
import {ActionContext} from 'vuex'
import {Layer} from 'mapbox-gl'
import CityPyODefaultUser from "@/config/cityPyoDefaultUser.json";
import FocusAreasLayer from "@/config/focusAreas.json";

export default {
  async createDesignLayers({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
    commit("scenario/loader", true);
    commit("scenario/loaderTxt", "Creating Design Layers ... ");
    const sourceConfigs = Designs.sources || [];
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
                Designs.layers
                  .filter(l => l.source === source.id)
                  .forEach(l => {
                    dispatch('addLayerToMap', l).then(() => {
                      designLayersLoaded += 1;
                      commit("scenario/loaderTxt", "Design Layer #" + designLayersLoaded + " successfully loaded ... ");
                      if (designLayersLoaded >= Designs.layers.length) {
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
  orderDesignLayers ({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
    // put groundfloor on top of spaces
    state.map?.moveLayer('spaces', 'groundfloor')
    // and upperfloor on top of groundfloor
    state.map?.moveLayer('upperfloor')
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
  checkoutWorkshop({state, commit, dispatch}: ActionContext<StoreState, StoreState>){
    console.log(window.location.href);
    if (window.location.href.indexOf("/workshop") > -1) {
      commit('checkoutWorkshop', true);
    }
  },
  connect({commit}: ActionContext<StoreState, StoreState>, options?: ConnectionOptions) {
    if (!options) {
      // login with default user if no userdata is passed
      commit('cityPyO', new CityPyO(CityPyODefaultUser))
    } else {
      commit('cityPyO', new CityPyO(options.userdata))
    }
  },
  addFocusAreasMapLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>){
    state.cityPyO.getLayer("focusAreas").then(source => {
        commit('focusAreasGeoJson', source.options.data)
        dispatch('addSourceToMap', source, {root: true})
          .then(source => {
            dispatch('addLayerToMap', FocusAreasLayer.layer, {root: true})
          }).then(source => {
          // add layer on top of the layer stack
          if (state.map?.getLayer("abmTrips")) {
            state.map?.moveLayer(FocusAreasLayer.layer.id, "groundfloor")
          }
        })
      }
    )
  },
  getGrasbrookGeoJson({state, commit, dispatch}: ActionContext<StoreState, StoreState>){
    state.cityPyO.getLayer("grasbrookArea", false).then(geojson => {
        commit('grasbrookGeoJson', geojson)
      }
    )
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
