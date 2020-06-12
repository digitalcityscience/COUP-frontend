import { generateSimpleGetters, generateSimpleMutations } from '@/store/utils/generators'
import { defaultMap } from '@/defaults'
import { defaults as olDefaultInteractions } from 'ol/interaction.js';
import { Map } from 'ol'
import { OSM } from 'ol/source';
import OLCesium from 'ol-cesium';
import 'ol/ol.css'
import Config from "@/config/config.json";
import TileLayer from 'ol/layer/Tile';

/**
 * User type definition
 * @typedef {object} MapState
 * @property {?module:ol/Map} map currently active map instance
 * @property {?number} zoomLevel active zoom level
 * @property {?number} maxZoomLevel maximum zoom level
 * @property {?number} minZoomLevel minimum zoom level
 * @property {?number} scale scale 1:x, where x is saved here
 * @property {?number} resolution active resolution (changes with zoom level)
 * @property {?number} maxResolution maximum resolution
 * @property {?number} minResolution minimum resolution
 * @property {?[number, number]} mouseCoord last mouse position
 * @property {?[number, number]} center coordinate
 * @property {?[number, number, number, number]} bbox current bounding box
 * @property {?string} projection name of currently active projection
 * @property {?number} rotation current rotation
 * @property {?number[]} layerIds list of layer ids
 * @property {?object.<string, LayerData>} layers register of existing layers
 * @property {?number[]} overlayIds list of layer ids
 * @property {?object.<string, LayerData>} overlays list of existing overlays
 */
const initialState = {
    map: null,
    map3d: null,
    zoomLevel: null,
    maxZoomLevel: null,
    minZoomLevel: null,
    scale: null,
    resolution: null,
    maxResolution: null,
    minResolution: null,
    center: null,
    mouseCoord: null,
    bbox: null,
    rotation: null,
    overlayIds: null,
    overlays: null
}

export default {
    state: {
        ...initialState
    },
    getters: {
        ...generateSimpleGetters(initialState),
        bbox: s => s.bbox || Config.Map.BBox
    },
    mutations: {
        ...generateSimpleMutations(initialState)
    },
    actions: {
        generateMap ({ state, commit, dispatch }) {
            dispatch("CRS/registerProjections", (Config.Map?.Projections));

            const baseLayer = new TileLayer({
                source: new OSM()
            });

            const map = new Map({
                target: defaultMap.id,
                layers: [],
                view: state.view,
                controls: [],
                interactions: olDefaultInteractions(Config.Map?.Interactions || {})
            })

            commit('map', map)

            baseLayer.set('id', 0);
            dispatch('Layers/addLayer', baseLayer);

            // Config.Layers.forEach(l => dispatch('Layers/createLayer', l));

            setTimeout(() => {
                const map3d = new OLCesium({map: state.map})
                map3d.setEnabled(true);
    
                commit('map3d', map3d)
            }, 4000);
        }
    }
}
