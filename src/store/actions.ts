import Config from '@/config/config.json'
import CityPyO from '@/store/cityPyO'
import { ActionContext } from 'vuex'
import { Layer } from 'mapbox-gl'
import {
  buildTripsLayer,
  animate,
  addFilterForBridgeLayer,
  abmTripsLayerName,
  getBridgeLayer
} from "@/store/deck-layers";


export default {
    createMapboxLayer({state, commit}: ActionContext<StoreState, StoreState>, payload: RawSource) {
        state.map?.addSource(payload.id, payload.options)

        Config.layers
            .filter(l => l.source === payload.id)
            .forEach(l => state.map?.addLayer(l as Layer))


      commit('addLayerId', payload.id)
    },
    createDeckLayer({state, commit}: ActionContext<StoreState, StoreState>) {
        buildTripsLayer(state)
        commit('addLayerId', abmTripsLayerName)
    },
    fetchLayersData ({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
        const sourceConfigs = Config.sources || [];

        sourceConfigs.forEach(config => {
            console.log(config)
            if (config.data?.from === "cityPyO") {
              state.cityPyO.getLayer(config.data.id)
                .then(source => {
                  dispatch('createMapboxLayer', source)
                  console.log(source)
                })
            }
            })

      console.log("this is the map after data fetching", state.map)
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
            }
            catch (e) {
                console.warn('Could not find feature match in raw data', e)
            }
        }
    },
    connect ({commit}: ActionContext<StoreState, StoreState>, options: ConnectionOptions) {
        commit('cityPyO', new CityPyO(options.userdata))
    },
    animateTripsLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
      console.log("animating this layer",state.map.getLayer(abmTripsLayerName) )
      // animate(state.map.getLayer(abmTripsLayerName))
    },
    updateAbmScenario({state, commit, dispatch}: ActionContext<StoreState, StoreState>, scenarioUpdate: GenericObject) {
      const key = Object.keys(scenarioUpdate)[0]  // todo send entire scenario instead of "scenarioUpdate" ?

      // remove trips layer if existing
      if (abmTripsLayerName in state.layerIds) {
        commit('removeLayerId', abmTripsLayerName)
        state.map?.removeLayer(abmTripsLayerName)
      }
      // update scenario
      state.abmScenario[key] = scenarioUpdate[key]
      // create new deckLayer
      dispatch('createDeckLayer', state)

      let filteredLayer = getBridgeLayer(state)
      state.map.removeLayer('bridges')
      state.map.addLayer(filteredLayer)
      console.log("bridgeLayer",  state.map.getLayer('bridges'))
    },
    /**
     * Parses the module configs to the respective store modules
     * @param {*} state - the module store state
     * @param {*} moduleName - the module to parse the config data to
     * @param {*} [config=Config] - the config.json, defaults to "./config.json"
     * @returns {void}
     */
    parseConfig ({ state, commit }: ActionContext<StoreState, StoreState>, moduleName: string, config: GenericObject = Config) {
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
}
