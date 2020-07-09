import Designs from '@/config/designs.json'
import Scenarios from '@/config/scenarios.json'
import Config from '@/config/config.json'
import CityPyO from '@/store/cityPyO'
import { ActionContext } from 'vuex'
import { Layer } from 'mapbox-gl'
import {
  buildTripsLayer,
  getScenarioName,
  abmTripsLayerName,
  animate,
  getBridgeLayer
} from "@/store/deck-layers";


export default {
    createDesignLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>, payload: RawSource) {
      const config = Designs
      // this.createMapboxLayer({payload, config})
      dispatch('createMapboxLayer', {source: payload, config: config});
    },
  // todo add lookup for layers belonging to each scenario ({"ABM": ["bridges"]} could be one example
    createScenarioLayer({state, commit}: ActionContext<StoreState, StoreState>) {
      const scenarioName = getScenarioName(state.abmScenario)
      const config = Scenarios
      const source = config.sources.filter(l => l.id === 'bridges')
      const data = {}
      if (source.data?.from === "cityPyO") {
        state.cityPyO.getLayer(config.data.id)
          .then(cityPyoResponse => {
            state.map?.addSource(cityPyoResponse.id, cityPyoResponse.options)

            console.log(cityPyoResponse)
          })
      }

    },

    createMapboxLayer({state, commit}: ActionContext<StoreState, StoreState>, {source, config}: {source: RawSource, config: GenericObject}) {
        state.map?.addSource(source.id, source.options)
      console.log(source, config)

      const _config = config || Config;

      _config.layers
            .filter(l => l.source === source.id)
            .forEach(l => state.map?.addLayer(l as Layer))


      commit('addLayerId', source.id) // TODO isn't this add several layers??
    },
    createDeckLayer({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
        buildTripsLayer(state)
          .then(deckLayer => {
            state.map?.addLayer(deckLayer)
            commit('addLayerId', abmTripsLayerName)
            console.log(state.map, state.map.getLayer(abmTripsLayerName));
            dispatch('animateTripsLayer')
          })
    },
    fetchLayersData ({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
        const sourceConfigs = Config.sources || [];

        sourceConfigs.forEach(config => {
            console.log(config)
            if (config.data?.from === "cityPyO") {
              state.cityPyO.getLayer(config.data.id)
                .then(source => {
                  if (source) {
                    dispatch('createMapboxLayer', {source})
                  }
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
    animateTripsLayer({state}: ActionContext<StoreState, StoreState>) {
      console.log("animating this layer", state.map.getLayer(abmTripsLayerName) )
      animate(state.map.getLayer(abmTripsLayerName))
    },
    async updateAbmScenario({state, commit, dispatch}: ActionContext<StoreState, StoreState>, scenarioUpdate: GenericObject) {
      const key = Object.keys(scenarioUpdate)[0]  // todo send entire scenario instead of "scenarioUpdate" ?

      // remove trips layer if existing
      if (abmTripsLayerName in state.layerIds) {
        commit('removeLayerId', abmTripsLayerName)
        state.map?.removeLayer(abmTripsLayerName)
      }

      // update scenario
      state.abmScenario[key] = scenarioUpdate[key]

      // create new deckLayer
      dispatch('createDeckLayer').then(() => {

      })
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
