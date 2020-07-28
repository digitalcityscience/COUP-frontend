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

      interface ScenarioResult {
        designScenario: string,
        moduleSettings: {},
        scenarioViewFilters: {}
      }

      interface AbmScenario extends  ScenarioResult{
        designScenario: string,
        moduleSettings: {
          bridge_1: boolean,
          amenities_roof: "random"|"complementary",
          blocks: "open"|"closed",
          bridge_2: false,
          paths: "vertical"|"horizontal"
        },
        scenarioViewFilters: {
          start_time?: number,
          end_time?: number,
          working_age?: boolean,
          mode?: string,
          agent_personality?: string,
        }
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
