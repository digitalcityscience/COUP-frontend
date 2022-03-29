import { buildingLayerIds, getLayerOrder } from "@/services/layers.service";
import { MapboxMap } from "@/models";
import { TypedStyleLayer } from "maplibre-gl";
import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";

import LandscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";

export function showBuildings(map: MapboxMap | null): void {
  showLayers(map, buildingLayerIds);
}

export function hideBuildings(map: MapboxMap | null): void {
  hideLayers(map, buildingLayerIds);
}

export function showLandscapeDesign(map: MapboxMap | null): void {
  showLayers(map, [LandscapeLayerConfig.layerConfig.id]);
}

const amenityLayers = ["abmAmenities"];

export function showAmenities(map: MapboxMap | null): void {
  showLayers(map, amenityLayers);
}

export function hideAmenities(map: MapboxMap | null): void {
  hideLayers(map, amenityLayers);
}

export function mapHasLayer(map: MapboxMap | null, layerId: string): boolean {
  if (map?.getLayer(layerId)) {
    return true;
  }

  return false;
}

export function showLayers(map: MapboxMap | null, layers: string[]): void {
  layers.forEach((layer) => {
    if (mapHasLayer(map, layer)) {
      map?.setLayoutProperty(layer, "visibility", "visible");
    }
  });
}

export function hideLayers(map: MapboxMap | null, layers: string[]): void {
  layers.forEach((layer) => {
    if (mapHasLayer(map, layer)) {
      map?.setLayoutProperty(layer, "visibility", "none");
    }
  });
}

// hide all layers but buildings and landscape
export function hideAllResultLayers(map: MapboxMap) {
  hideAllLayersButThese(map, []);
}

export function hideAllLayersButThese(
  map: MapboxMap,
  layersToShow: string[] = [],
  hideDesignLayers = false
) {
  // TODO: design layer names as global variable add in createDesignLayers
  const designLayers = ["spaces", "groundfloor", "upperfloor", "rooftops"];
  if (!hideDesignLayers) {
    layersToShow.push(...designLayers);
  }
  // first hide all user-content layers
  hideLayers(map, getUserContentLayerIds(map));

  if (!hideDesignLayers) {
    showBuildings(map);
    showLandscapeDesign(map);
  }
  // then show layers in layersToShow
  showLayers(map, layersToShow);
}

// get all layers that had been added by the user (like buildings, calculation results, ..)
export function getUserContentLayers(map: MapboxMap | null): TypedStyleLayer[] {
  try {
    // @ts-ignore  - only this map.style._layers includes custom layers like DeckLayer (TripsLayer, Aggregration, ..)
    const allLayers: GenericObject = map.style._layers;
    return (
      Object.values(allLayers).filter(
        (layer) => layer.metadata === "user-content" || layer.type === "custom"
      ) ?? []
    );
  } catch {
    // getStyle fails when the map is not fully initated yet.
    // Unfortunately there is no way of knowing whether the map is ready or not.
    return [];
  }
}

export function getUserContentLayerIds(map: MapboxMap | null): string[] {
  return getUserContentLayers(map).map((layer) => {
    return layer.id;
  });
}

export function addDeckLayerToMap(layer: DeckLayer<any>, map: MapboxMap): void {
  addLayerToMap(layer, map);
}

/** Adds a source and a layer to the map */
export function addSourceAndLayerToMap(
  source: any,
  layers: any[],
  map: MapboxMap | null
): void {
  if (map?.getSource(source.id)) {
    // remove all layers using this source and the source itself
    removeSourceAndItsLayersFromMap(source.id, map);
  }
  map?.addSource(source.id, source.options);

  layers.forEach((layer) => {
    addLayerToMap(layer, map);
  });
  updateLayerOrder(map);
}

/** removes a source and all its layers from map  */
export function removeSourceAndItsLayersFromMap(
  sourceId: string,
  map: MapboxMap | null
): void {
  if (!map?.getSource(sourceId)) {
    // source is not on map
    return;
  }

  // remove all layers using this source first
  const layerIds = getUserContentLayerIds(map);

  layerIds.forEach((layerId: string) => {
    if (map?.getLayer(layerId).source === sourceId) {
      map?.removeLayer(layerId);
    }
  });

  // finally remove the source
  map?.removeSource(sourceId);
}

// adds layer to map
function addLayerToMap(
  layer: TypedStyleLayer | DeckLayer<any>,
  map: MapboxMap | null
): void {
  // remove layer first if exits
  if (map?.getLayer(layer.id)) {
    map?.removeLayer(layer.id);
  }

  // @ts-ignore
  layer.metadata = "user-content"; // differentiate layer from mapbox base layers like "sattelite" , ...
  map?.addLayer(layer);
}

// ensures the right layer order
export function updateLayerOrder(map: MapboxMap | null): void {
  for (const layerName of getLayerOrder()) {
    if (map?.getLayer(layerName)) {
      //console.log("putting layer on top ", layerName)
      map?.moveLayer(layerName);
    }
  }
}
