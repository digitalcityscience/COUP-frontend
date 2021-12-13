import { PolygonLayer } from "@deck.gl/layers";
import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";
import { GeoJSON } from "@/models";
import { MapboxLayerProps } from "@deck.gl/mapbox/mapbox-layer";
export interface FeatureCollection {
  features: GeoJSON[];
}

export function buildSWLayer(
  featureCollection: FeatureCollection,
  time: number
): DeckLayer<unknown> {
  return new DeckLayer({
    id: "stormwater",
    type: PolygonLayer,
    data: featureCollection?.features,
    pickable: true,
    filled: true,
    opacity: 0.75,
    extruded: true,
    getElevation: 0,
    swTime: 0,
    getPolygon: (d: any) => d.geometry.coordinates.flat(1),
    getFillColor: (d) =>
      getPolygonColor(d["properties"]["runoff_results"]["runoff_value"][time]),
    visible: true,
  } as unknown as MapboxLayerProps<unknown>);
}

export function getPolygonColor(d: number): [number, number, number] {
  if (d <= 0.2) {
    return [12, 45, 140];
  }
  if (d > 0.2 && d <= 0.4) {
    return [16, 37, 199];
  }
  if (d > 0.4 && d <= 0.6) {
    return [58, 90, 250];
  }
  if (d > 0.6 && d <= 0.8) {
    return [100, 130, 250];
  }
  if (d > 0.8 && d <= 1.0) {
    return [166, 188, 250];
  }
  if (d > 1.0 && d <= 2.0) {
    return [218, 232, 250];
  }
  if (d > 2.0 && d <= 4.0) {
    return [236, 249, 229];
  }
  if (d > 4.0 && d <= 8.0) {
    return [250, 244, 152];
  }
  if (d > 8.0 && d <= 16) {
    return [247, 213, 62];
  }
  if (d > 16 && d <= 32) {
    return [224, 160, 73];
  }
  if (d > 32 && d <= 64) {
    return [224, 85, 63];
  }
  if (d > 64 && d <= 128) {
    return [130, 21, 9];
  }
}
