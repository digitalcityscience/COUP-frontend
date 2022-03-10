import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";
import { ColumnLayer } from "@deck.gl/layers";

export {};

declare global {
  interface GenericObject {
    [key: string]: any;
  }

  // cityPyo
  interface ConnectionOptions {
    userdata: Userdata;
  }

  interface Userdata {
    username: string;
    password: string;
  }

  // multiLayerAnalysis
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
