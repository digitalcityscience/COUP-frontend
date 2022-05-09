import type { SourceAndLayerConfig } from "@/models";

const buildingLayersConfigs: SourceAndLayerConfig[] = [
  {
    source: {
      id: "groundfloor",
      options: {
        type: "geojson",
        data: {},
      },
    },
    layerConfig: {
      id: "groundfloor",
      type: "fill-extrusion",
      source: "groundfloor",
      paint: {
        "fill-extrusion-height": 5,
        "fill-extrusion-color": [
          "match",
          ["get", "selected"],
          "inactive",
          "#f5f5f5",
          "active",
          [
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
          "#f5f5f5",
        ],
        "fill-extrusion-opacity": 0.8,
      },
    },
  },
  {
    source: {
      id: "upperfloor",
      options: {
        type: "geojson",
        data: {},
      },
    },
    layerConfig: {
      id: "upperfloor",
      type: "fill-extrusion",
      source: "upperfloor",
      paint: {
        "fill-extrusion-color": [
          "match",
          ["get", "selected"],
          "inactive",
          "#f5f5f5",
          "active",
          [
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
          "#f5f5f5",
        ],
        "fill-extrusion-height": ["to-number", ["get", "building_height"]],
        "fill-extrusion-base": 5,
        "fill-extrusion-opacity": 0.8,
      },
    },
  },
  {
    source: {
      id: "rooftops",
      options: {
        type: "geojson",
        data: {},
      },
    },
    layerConfig: {
      id: "rooftops",
      type: "fill-extrusion",
      source: "rooftops",
      paint: {
        "fill-extrusion-color": [
          "match",
          ["get", "selected"],
          "inactive",
          "#f5f5f5",
          "active",
          [
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
          "#f5f5f5",
        ],
        "fill-extrusion-height": [
          "to-number",
          ["get", "additional_roof_height"],
        ],
        "fill-extrusion-base": ["to-number", ["get", "building_height"]],
        "fill-extrusion-opacity": 0.8,
      },
    },
  },
];

export default buildingLayersConfigs;
