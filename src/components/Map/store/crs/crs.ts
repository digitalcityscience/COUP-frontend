import { getProjection, getProjections, getMapProjection, transform, transformFromMapProjection, transformToMapProjection, registerProjections } from './utils';
import {defaultProjections} from "@/defaults"
import { Map } from 'ol';

const initialState = {
    projectionDefs: []
}

export default {
    namespaced: true,
    state: {
        ...initialState
    },
    getters: {
        projection: _ => (name: string) => getProjection(name),
        projections: _ => getProjections(),
        mapProjection: _ => (map: Map) => getMapProjection(map),
    },
    mutations: {
    },
    actions: {
        registerProjections(_, projections?: string[][]) {
            registerProjections(projections || defaultProjections)
        }
    }
}