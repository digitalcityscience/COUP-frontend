import {INITIAL_VIEW_STATE, DEFAULT_LAYER_OPTIONS_GEOJSON} from "@/defaults";
import {TileLayer} from '@deck.gl/geo-layers';
import { ScatterplotLayer, BitmapLayer, GeoJsonLayer } from '@deck.gl/layers';
import groundfloor from '@/assets/groundfloor.json';

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
      new TileLayer({
        id: "basemap",
        // data: layer.data,
        data: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png',

        minZoom: 0,
        maxZoom: 19,

        renderSubLayers: props => {
          const {
            bbox: { west, south, east, north }
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north]
          });
        }
      }),
        new GeoJsonLayer({
          id: 'groundfloor',
          data: groundfloor,
          ...DEFAULT_LAYER_OPTIONS_GEOJSON,
          // ...(layer.options || {})
      })
    ],
    view: INITIAL_VIEW_STATE,
    userid: null
}

export default initialState;