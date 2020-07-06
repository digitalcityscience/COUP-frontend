import mapboxgl, { Source, ImageSource, GeoJSONSource, VectorSource, RasterSource, AnySourceData } from "mapbox-gl";
import CityPyO from "./store/cityPyO";
import { GeoJsonLayer } from "@deck.gl/layers";

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

      interface StoreState {
        map: mapboxgl.Map | null,
        layerIds: string[],
        selectedFeatures: any[]
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
        options: AnySourceData
      }
}