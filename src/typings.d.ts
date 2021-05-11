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

      interface AbmScenario extends ScenarioResult{
        bridges: string[],
        resultLoading: boolean,
        currentlyShownScenarioSettings: AbmScenarioSettings,
        resultOutdated: boolean,
        moduleSettings: AbmScenarioSettings,
        scenarioViewFilters: {
          start_time?: number,
          end_time?: number,
          resident_or_visitor?: "resident" | "visitor" | null,
          student_or_adult?: string[],
          modes?: {
            bicycle: boolean
            car: boolean
            foot: boolean
            public_transport: boolean
          }
        }
      }

      interface NoiseScenario {
          traffic_percent: number
          max_speed: number
      }

      interface AbmScenarioSettings {
          bridge_hafencity: boolean,
          bridge_veddel: "horizontal" | "diagonal",
          roof_amenities: "random" | "complementary",
          blocks: "open" | "closed",
          main_street_orientation: "vertical" | "horizontal"
      }

      interface StoreState {
        map: mapboxgl.Map | null,
        activeMenuComponent: string,
        layerIds: string[],
        allFeaturesHighlighted: boolean,
        showLegend: boolean,
        currentTime: number,
        view: View,
        accessToken: string,
        cityPyO: CityPyO | null,
        mapStyle: string,
        restrictedAccess: Boolean,
        focusAreasGeoJson: GenericObject | null,
        focusAreasShown: boolean,
        openModalsIds: string[],
        modalIndex: number,
        selectedObjectId: string | null,
        selectedMultiFeatures: any[],
        featureCircles: any[]
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

      interface LayerAnalysisRequest {
        layerName: string,
        layerRange: number[],
        layerConstraints: number[],
        logicOperator: string
      }

      interface logicOperator {
        and: "and",
        or: "or",
        and_not: "and_not",
        or_not: "or_not"
      }
}
