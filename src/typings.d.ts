import { Deck, Layer } from "@deck.gl/core"
import { GeoJsonLayer, TileLayer } from "@deck.gl/geo-layers"
import { PolygonLayer, BitmapLayer } from "@deck.gl/layers"

export {};

declare global {
    interface GenericObject {
        [key: string]: any;
      }
      interface StoreModule {
        state: GenericObject;
        getters: GenericObject;
        mutations: GenericObject;
        actions: GenericObject;
      }

      interface StoreState {
        layers: ioLayer[]
        deck: Deck | null;
        deckLayers: Array<Layer<any> | TileLayer<any> | GeoJsonLayer<any> | PolygonLayer<any> | BitmapLayer<any>>;
        view: View,
        userid: string | null
      }

      interface View {
        longitude: number;
        latitude: number;
        zoom: number;
        pitch: number;
        bearing: number;
    }

    interface ioLayer {
      id: string;
      type: 'geojson' | 'image' | 'flitzepunkte' | 'tilelayer';
      data: any,
      options?: GenericObject
    }
}