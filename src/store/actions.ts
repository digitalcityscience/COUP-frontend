import Config from '@/config/config.json'

export default {
    /**
     * Parses the module configs to the respective store modules
     * @param {*} state - the module store state
     * @param {*} moduleName - the module to parse the config data to
     * @param {*} [config=Config] - the config.json, defaults to "./config.json"
     * @returns {void}
     */
    parseConfig ({ state, commit }, moduleName, config: GenericObject = Config) {
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
    }
}
