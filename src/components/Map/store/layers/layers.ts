import { generateSimpleGetters, generateSimpleMutations } from '@/store/utils/generators'
import vectorStyles from './vectorStyles';
import WFS from "ol/format/WFS";
import {Vector as VectorLayer, Layer} from "ol/layer.js";
import {Vector as VectorSource} from "ol/source.js";
import wfs from './wfs';
import { defaultLayerRequest, defaultLayerOptions } from "@/defaults";
import { Map } from 'ol';
import { assignLayerId } from './utils';

const initialState = {
    layers: []
}

export default {
    namespaced: true,
    state: {
        ...initialState
    },
    getters: {
        ...generateSimpleGetters(initialState)
    },
    mutations: {
        ...generateSimpleMutations(initialState)
    },
    actions: {
        addLayer({state, rootState}, layer: Layer) {
            if (!state.layers.find(l => l === layer)) {
                (rootState?.Map?.map as Map).addLayer(layer);
                state.layers.push(layer);
            }
        },
        removeLayer({state, rootState}, layerOrId: Layer | string) {
            const rmLayer = state.layers.find(l => l === layerOrId || l.get('id') === layerOrId);

            if (rmLayer) {
                (rootState?.Map?.map as Map).removeLayer(rmLayer);
                state.layers = state.layers.filter(l => l !== rmLayer);
            }
        },
        createLayer({dispatch, rootState, state}, layerConfig: any) {
            const opts = {
                ...defaultLayerOptions,
                id: assignLayerId(state),
            }

            const url = wfs.composeUrl(layerConfig.url, layerConfig.typename, {
                srsname: layerConfig.srsname,
                bbox: layerConfig.bbox, 
                version: layerConfig.version,
                outputFormat: layerConfig.outputFormat
            });
    
            const source = new VectorSource({
                format: new WFS(),
                url,
                strategy: layerConfig.strategy || defaultLayerRequest.strategy
            })

            const style = vectorStyles.styleFromConfig(layerConfig.style);
    
            const layer = new VectorLayer({
                ...opts,
                ...layerConfig,
                source,
                style
            })

            // console.log(style);

            dispatch('addLayer', layer);
            return layer;
        },

    }
}
