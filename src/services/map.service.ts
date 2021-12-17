import { getLayerOrder } from '@/config/layers';
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

// get all layers that had been added by the user (like buildings, calculation results, ..)
export function getUserContentLayers(map: MapboxMap | null ): Layer[] {
  try {
    return (
      map
        .getStyle()
        .layers.filter((layer) => layer.metadata === "user-content") ?? []
    );
  } 
  catch {
    // getStyle fails when the map is not fully initated yet. 
    // Unfortunately there is no way of knowing whether the map is ready or not.
    return []
  }
}

export function getUserContentLayerIds(map: MapboxMap | null ): string[] {
  return getUserContentLayers(map).map((layer) => { 
    return layer.id
  });
}


/** Adds a source and a layer to the map */
export function addSourceAndLayerToMap(source: any, layer: any, map:MapboxMap | null ): void {
  if (map?.getSource(source.id)) {
    // remove all layers using this source and the source itself
    this.removeSourceAndItsLayersFromMap(source.id);
  }
  map?.addSource(source.id, source.options);
  addLayerToMap(layer, map)
  updateLayerOrder(map)
}

/** removes a source and all its layers from map  */
export function removeSourceAndItsLayersFromMap(sourceId: string, map: MapboxMap | null ): void {
  if (!map?.getSource(sourceId)) {
    // source is not on map
    return
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
function addLayerToMap(layer: Layer, map:MapboxMap | null ): void {
  // remove layer first if exits
  if (map?.getLayer(layer.id)) {
    map?.removeLayer(layer.id);
  }

  layer.metadata = "user-content";  // differentiate layer from mapbox base layers like "sattelite" , ...
  map?.addLayer(layer);  
}

// ensures the right layer order
export function updateLayerOrder(map: MapboxMap | null ): void {
  for (const layerName of getLayerOrder()) {
    if (map?.getLayer(layerName)) {
      //console.log("putting layer on top ", layerName)
      map?.moveLayer(layerName);
    }
  }
}


