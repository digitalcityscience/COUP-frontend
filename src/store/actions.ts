import {GeoJsonLayer} from '@deck.gl/layers';
import {MapboxLayer} from '@deck.gl/mapbox';
import Config from '@/config/config.json'
import CityPyO from './cityPyO'
import { ActionContext } from 'vuex'

export default {
    fetchLayerData ({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
        const sourceConfigs = Config.sources || [];

        sourceConfigs.forEach(config => {
            if (config.data?.from === "cityPyO") {
              if (config.type == "deck-layer") {
                state.cityPyO.getLayer(config.data.id)
                  .then(source => commit('addLayer', this.buildTripsLayer(source)))
              } else {
                state.cityPyO.getLayer(config.data.id)
                  .then(source => commit('addSource', source))
              }
    }
            //if
        })
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
                }
                catch (e) {
                    state[moduleName][attr] = moduleConfig[attr]
                }
            }
        }
    },
}

function buildTripsLayer(source) {
  return new MapboxLayer({
    id: source.id,
    type: GeoJsonLayer,
    data: {},
    stroked: true,
    filled: true,
    lineWidthMinPixels: 2,
    opacity: 0.4,
    getLineColor: [255, 100, 100],
    getFillColor: [200, 160, 0, 180]
  });
}


