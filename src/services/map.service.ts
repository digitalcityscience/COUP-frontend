import { getLayerOrder } from "@/services/layers.service";
import { MapboxMap } from "@/models";
import { LayerSpecification, TypedStyleLayer } from "maplibre-gl";
import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";

import LandscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";
import { buildingLayersNoColor, buildingLayersColored } from "@/config/urbanDesignLayers/buildingLayersConfigs";

export function showBuildings(map: MapboxMap | null): void {
  showLayers(map, buildingLayersNoColor);
}

export function hideBuildings(map: MapboxMap | null): void {
  hideLayers(map, [ 
    ...buildingLayersNoColor,
    ...buildingLayersColored
  ]);
}

/** shows or hides colorization of buildings by use type */
export function toggleBuildingColors(map: MapboxMap) {
  if (areBuildingUsesColored(map)) {
    hideBuildingUseColors(map);
  } else {
    showBuildingUseColors(map);
  }
}

/** checks if highlighted layers by building use are visible */
export function areBuildingUsesColored(map: MapboxMap): boolean {
  return buildingLayersColored.some(r => getVisibleLayerIds(map).includes(r))
}

export function showBuildingUseColors(map: MapboxMap | null): void {
  showLayers(map, buildingLayersColored);
}

export function hideBuildingUseColors(map: MapboxMap | null): void {
  hideLayers(map, buildingLayersColored);
}

export function showLandscapeDesign(map: MapboxMap | null): void {
  showLayers(map, LandscapeLayerConfig.layerConfigs.map((conf) => {return conf.id}));
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

/** returns is list of currently visible user content layers */
export function getVisibleLayerIds(map: MapboxMap | null): string[] {
  const visibleLayers = getUserContentLayers(map).filter((layer) => {
    if (map.getLayoutProperty(layer.id, "visibility") !== "none") {
      return true;
    }
  });

  return visibleLayers.map((layer) => {
    return layer.id;
  });
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
  layers: LayerSpecification[],
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
  // @ts-ignore
  map?.addLayer(layer);
  // setting visibility is strictly needed to display,
  // but needed to identify visible layers by "getLayoutProperty"
  map.setLayoutProperty(layer.id, "visibility", "visible");
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
