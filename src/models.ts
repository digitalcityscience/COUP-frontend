import type { Map as MapboxMap } from "mapbox-gl";
import CityPyO from "./store/cityPyO";

export interface VisibleLayers {
  focusAreas: boolean;
  abm: boolean;
  heat: boolean;
  amenities: boolean;
  noise: boolean;
  stormwater: boolean;
  wind: boolean;
  sunExposure: boolean;
  multiLayerAnalysis: boolean;
  trees: boolean;
}

export interface StoreState {
  map: MapboxMap | null;
  activeMenuComponent: string;
  layerIds: string[];
  allFeaturesHighlighted: boolean;
  showLegend: boolean;
  currentTime: number;
  view: View;
  accessToken: string;
  cityPyO: CityPyO | null;
  mapStyle: string;
  restrictedAccess: boolean;
  focusAreasGeoJson: Record<string, unknown> | null;
  focusAreasShown: boolean; // TODO: use visible layers instead
  openModalsIds: string[];
  modalIndex: number;
  selectedObjectId: string | null;
  selectedMultiFeatures: unknown[];
  featureCircles: unknown[];
  visibleLayers: VisibleLayers;
}
