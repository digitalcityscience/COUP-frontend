import {INITIAL_VIEW_STATE} from "@/defaults";
import {TileLayer} from '@deck.gl/geo-layers';
import { ScatterplotLayer, BitmapLayer } from '@deck.gl/layers';

const initialState: StoreState = {
    layers: [
      {
        id: 'basemap',
        type: 'tilelayer',
        data: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'
      }
    ],
    deck: null,
    deckLayers: [
    ],
    view: INITIAL_VIEW_STATE,
    userid: null
}

export default initialState;