import type { AnySourceData as AnyMabboxLayer } from "mapbox-gl";
import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";
import { ColumnLayer } from "@deck.gl/layers";

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
    rendered: any;
    source: any;
    sourceId: string;
  }

  interface ScenarioResult {
    designScenario: string;
    moduleSettings: Record<string, any>;
  }

  interface AbmScenario extends ScenarioResult {
    bridges: string[];
    resultLoading: boolean;
    currentlyShownScenarioSettings: AbmScenarioSettings;
    resultOutdated: boolean;
    moduleSettings: AbmScenarioSettings;
  }

  interface NoiseScenario {
    traffic_quota: number;
    max_speed: number;
  }

  interface AbmScenarioSettings {
    bridge_hafencity: boolean;
    bridge_veddel: "horizontal" | "diagonal";
    roof_amenities: "random" | "complementary";
    blocks: "open" | "closed";
    main_street_orientation: "vertical" | "horizontal";
  }

  interface ConnectionOptions {
    userdata: Userdata;
  }

  interface Userdata {
    username: string;
    password: string;
  }

  interface RawSource {
    id: string;
    options:
      | AnyMamboxLayer
      | DeckLayer<unknown>
      | ColumnLayer<unknown, unknown>;
  }

  interface LayerAnalysisRequest {
    layerName: string;
    layerRange: number[];
    layerConstraints: number[];
    logicOperator?: string;
  }

  interface logicOperator {
    and: "and";
    or: "or";
    and_not: "and_not";
    or_not: "or_not";
  }
}
