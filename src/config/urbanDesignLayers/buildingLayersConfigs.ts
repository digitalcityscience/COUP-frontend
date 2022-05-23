import type { MapSource, SourceAndLayerConfigs } from "@/models";
import { LayerSpecification } from 'maplibre-gl';


const groundFloorSource: MapSource = {
  id: "groundfloor",
  options: {
    type: "geojson",
    data: {},
  },
};

const groundFloorLayer: LayerSpecification = {
  id: "groundfloor",
  type: "fill-extrusion",
  source: "groundfloor",
  paint: {
    "fill-extrusion-height": 5,
    "fill-extrusion-color": "#f5f5f5",
    "fill-extrusion-opacity": 0.8,
  },
}

const groundFloorLayerHighlighted: LayerSpecification = {
  id: "groundfloor_highlighted",
  type: "fill-extrusion",
  source: "groundfloor",
  paint: {
    "fill-extrusion-height": 5,
    "fill-extrusion-color": [
      "match",
      ["get", "land_use_detailed_type"],
      "residential",
      "#FFD529",
      "commercialOffice",
      "#ab0124",
      "daycare",
      "#1380AB",
      "public",
      "#1380AB",
      "specialUse",
      "#1380AB",
      "#CDCDCD",
    ],
    "fill-extrusion-opacity": 0.8,
  },
};

const upperfloorSource: MapSource = {
  id: "upperfloor",
  options: {
    type: "geojson",
    data: {},
  },
};

const upperFloorLayer: LayerSpecification = {
  id: "upperfloor",
  type: "fill-extrusion",
  source: "upperfloor",
  paint: {
    "fill-extrusion-color": "#f5f5f5",
    "fill-extrusion-height": ["to-number", ["get", "building_height"]],
    "fill-extrusion-base": 5,
    "fill-extrusion-opacity": 0.8,
  },
};

const upperFloorLayerHighlighted: LayerSpecification = {
  id: "upperfloor_highlighted",
  type: "fill-extrusion",
  source: "upperfloor",
  paint: {
    "fill-extrusion-color": [
      "match",
      ["get", "land_use_detailed_type"],
      "residential",
      "#FFD529",
      "commercialOffice",
      "#ab0124",
      "industrial",
      "#ff75cf",
      "daycare",
      "#1380AB",
      "public",
      "#1380AB",
      "specialUse",
      "#1380AB",
      "#cdcdcd",
    ],
    "fill-extrusion-height": ["to-number", ["get", "building_height"]],
    "fill-extrusion-base": 5,
    "fill-extrusion-opacity": 0.8,
  },
};


const rooftopsSource: MapSource = {
  id: "rooftops",
  options: {
    type: "geojson",
    data: {},
  },
};

const rooftopsLayer: LayerSpecification = {
  id: "rooftops",
  type: "fill-extrusion",
  source: "rooftops",
  paint: {
    "fill-extrusion-color": "#f5f5f5",
    "fill-extrusion-height": [
      "to-number",
      ["get", "additional_roof_height"],
    ],
    "fill-extrusion-base": ["to-number", ["get", "building_height"]],
    "fill-extrusion-opacity": 0.8,
  },
};
const rooftopsLayerHighlighted: LayerSpecification = {
  id: "rooftops_highlighted",
  type: "fill-extrusion",
  source: "rooftops",
  paint: {
    "fill-extrusion-color": [
      "match",
      ["get", "land_use_detailed_type"],
      "residential",
      "#FFD529",
      "commercialOffice",
      "#ab0124",
      "industrial",
      "#ff75cf",
      "daycare",
      "#1380AB",
      "public",
      "#1380AB",
      "specialUse",
      "#1380AB",
      "#cdcdcd",
    ],
    "fill-extrusion-height": [
      "to-number",
      ["get", "additional_roof_height"],
    ],
    "fill-extrusion-base": ["to-number", ["get", "building_height"]],
    "fill-extrusion-opacity": 0.8,
  },
}

export const buildingLayersConfigs: SourceAndLayerConfigs[] = [
  {
    "source": groundFloorSource,
    "layerConfigs": [groundFloorLayer, groundFloorLayerHighlighted]
  },
  {
    "source": upperfloorSource,
    "layerConfigs": [upperFloorLayer, upperFloorLayerHighlighted]
  },
  {
    "source": rooftopsSource,
    "layerConfigs": [rooftopsLayer, rooftopsLayerHighlighted]
  }
];


export const buildingLayersNoColor: string[] = [
  groundFloorLayer.id,
  upperFloorLayer.id,
  rooftopsLayer.id
];

export const buildingLayersColored: string[] = [
  groundFloorLayerHighlighted.id,
  upperFloorLayerHighlighted.id,
  rooftopsLayerHighlighted.id
];