import { MapboxMap } from "@/models";
import { Layer } from "mapbox-gl";

export const buildingsLayers = ["groundfloor", "upperfloor", "rooftops"];

export function showBuildings(map: MapboxMap | null): void {
  showLayers(map, buildingsLayers);
}

export function hideBuildings(map: MapboxMap | null): void {
  hideLayers(map, buildingsLayers);
}

const amenityLayers = ["abmAmenities"];

export function showAmenities(map: MapboxMap | null): void {
  showLayers(map, amenityLayers);
}

export function hideAmenities(map: MapboxMap | null): void {
  hideLayers(map, amenityLayers);
}

export function showLayers(map: MapboxMap | null, layers: string[]): void {
  layers.forEach((layer) => {
    map?.setLayoutProperty(layer, "visibility", "visible");
  });
}

export function hideLayers(map: MapboxMap | null, layers: string[]): void {
  layers.forEach((layer) => {
    map?.setLayoutProperty(layer, "visibility", "none");
  });
}
export function getUserContentLayers(map: MapboxMap): Layer[] {
  if (!map.loaded()) {
    return [];
  }

  return (
    map
      .getStyle()
      .layers.filter((layer) => layer.metadata === "user-content") ?? []
  );
}

export function getUserContentLayerIds(map: MapboxMap): string[] {
  return getUserContentLayers(map).map((layer) => layer.id);
}
