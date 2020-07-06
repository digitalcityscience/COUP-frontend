import Config from '@/config/config.json'
import CityPyO from './cityPyO'
import { ActionContext } from 'vuex'
import { Source, GeoJSONSource, ImageSource, VectorSource, RasterSource, Layer } from 'mapbox-gl'
import { buildTripsLayer, animateTripsLayer } from "@/store/deck-layers";


export default {
    createLayer({state, commit}: ActionContext<StoreState, StoreState>, payload: RawSource) {
        state.map?.addSource(payload.id, payload.options)

        Config.layers
            .filter(l => l.source === payload.id)
            .forEach(l => state.map?.addLayer(l as Layer))

        commit('addLayerId', payload.id)
    },
    fetchLayerData ({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
        const sourceConfigs = Config.sources || [];

        sourceConfigs.forEach(config => {
            if (config.data?.from === "cityPyO") {
              if (config.type == "tripsLayerDeck") {
                state.cityPyO.getLayer(config.data.id)
                  .then(payload => commit('addLayer', buildTripsLayer(config, payload)))
              }
              else {
                state.cityPyO.getLayer(config.data.id)
                  .then(source => dispatch('createLayer', source))
              }
            }
          })
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
