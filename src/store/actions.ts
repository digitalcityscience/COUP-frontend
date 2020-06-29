import Config from '@/config/config.json'
import { INITIAL_VIEW_STATE } from "@/defaults"
import { Deck } from '@deck.gl/core'
import rest from './rest'
import { ActionContext } from 'vuex'
import { GeoJsonLayer, BitmapLayer } from '@deck.gl/layers'
import { DEFAULT_LAYER_OPTIONS_GEOJSON } from '@/defaults'
import { TileLayer } from '@deck.gl/geo-layers'
// import layerParser from './layerParser'

export default {
    renderDeck({state, commit}: ActionContext<StoreState, StoreState>) {
        commit("deck", new Deck({
            canvas: 'deck',
            initialViewState: Config.INITIAL_VIEW_STATE || INITIAL_VIEW_STATE,
            controller: true,
            width: "100%",
            height: "100%",
            layers: state.deckLayers
        }))

        console.log(state.deck)

        setTimeout(() => {
            console.log('holla die waldfee');
            const data = state.deckLayers[1].props.data;

            // data.features = data.features.filter(f => parseInt(f.id)%2 !== 0);
            console.log(data);

            const g = new GeoJsonLayer({
                id: 'groundfloor',
                data: data,
                ...DEFAULT_LAYER_OPTIONS_GEOJSON
                // ...(layer.options || {})
            })

            console.log(g, state.deckLayers[1], state.deckLayers[0]);

            state.deck.setProps({layers: [state.deckLayers[0], state.deckLayers[1]]})
        }, 5000);
    },
    renderLayers({state}: ActionContext<StoreState, StoreState>) {
        if (state.deck) {
            state.deck.setProps({layers: [...state.deckLayers]});
            console.log(state.deck)
        }
    },
    parseLayers({state, commit}: ActionContext<StoreState, StoreState>) {
        const deckLayers = state.layers.map(layer => {
            let deckLayer;

            if (layer.type === 'geojson') {
                deckLayer = new GeoJsonLayer({
                    id: layer.id,
                    data: layer.data,
                    ...DEFAULT_LAYER_OPTIONS_GEOJSON,
                    ...(layer.options || {})
                })
            }
            else if (layer.type === 'tilelayer') {
                deckLayer = new TileLayer({
                    id: layer.id,
                    data: layer.data,
                    // data: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',
                
                    minZoom: 0,
                    maxZoom: 19,
                
                    renderSubLayers: props => {
                      const {
                        bbox: {west, south, east, north}
                      } = props.tile;
                
                      return new BitmapLayer(props, {
                        data: null,
                        image: props.data,
                        bounds: [west, south, east, north]
                      });
                    }
                })
            }

            return deckLayer;
        })

        // commit('deckLayers', deckLayers)
    },
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
    },
    ...rest
}
