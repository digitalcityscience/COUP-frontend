import mapboxgl, { AnySourceData as AnyMapboxLayer } from "mapbox-gl";
import {MapboxLayer as DeckLayer} from '@deck.gl/mapbox';

import CityPyO from "./store/cityPyO";

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

      interface Feature {
        rendered: any,
        source: any,
        sourceId: string
      }

      interface AbmScenario {
      bridge1: boolean,
      bridge2: boolean,
      pathLayout: "vertical" | "horizontal",
      walkTroughBuildings: boolean
      }

      interface StoreState {
        map: mapboxgl.Map | null,
        layerIds: string[],
        selectedFeatures: any[],
        abmScenario: AbmScenario | null,
        view: View,
        accessToken: string,
        cityPyO: CityPyO | null,
        mapStyle: string,
      }

      interface View {
        center: number[]
        zoom: number;
        pitch: number;
        bearing: number;
      }

      interface ConnectionOptions {
        userdata: Userdata
      }

      interface Userdata {
        username: string,
        password: string
      }

      interface RawSource {
        id: string
        options: AnyMapboxLayer | DeckLayer
      }
}
