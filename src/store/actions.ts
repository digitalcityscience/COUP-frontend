import {MapboxLayer} from '@deck.gl/mapbox';
import {TripsLayer} from '@deck.gl/geo-layers';
import Config from '@/config/config.json'
import CityPyO from './cityPyO'
import { ActionContext } from 'vuex'
import { buildTripsLayer } from "@/store/deckel";

export default {
  fetchLayerData({state, commit, dispatch}: ActionContext<StoreState, StoreState>) {
    const sourceConfigs = Config.sources || [];

    sourceConfigs.forEach(config => {
      if (config.data?.from === "cityPyO") {
        if (config.type == "tripsLayerDeck") {
          state.cityPyO.getLayer(config.data.id)
            .then(payload => commit('addLayer', buildTripsLayer(config, payload)))
        } else {
          state.cityPyO.getLayer(config.data.id)
          .then(payload => commit('addSource', payload))
        }
      }
    })
  },
  connect({commit}: ActionContext<StoreState, StoreState>, options: ConnectionOptions) {
    commit('cityPyO', new CityPyO(options.userdata))
  },
  /**
   * Parses the module configs to the respective store modules
   * @param {*} state - the module store state
   * @param {*} moduleName - the module to parse the config data to
   * @param {*} [config=Config] - the config.json, defaults to "./config.json"
   * @returns {void}
   */
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
}



