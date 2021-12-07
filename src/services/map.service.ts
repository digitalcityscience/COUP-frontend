import { MapboxMap } from "@/models";

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
