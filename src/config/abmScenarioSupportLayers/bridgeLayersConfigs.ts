import type { MapSource } from "@/models";
import { LayerSpecification } from 'maplibre-gl';

export const bridgesSource: MapSource = {
  "id": "bridges",
  "options": {
    "type": "geojson",
    "data": {}
  }
}

export const hafenCityBridgeLayerConf: LayerSpecification = {
  "id": "bridge_hafencity",
  "type": "line",
  "source": "bridges",
  "paint": {
    "line-color": "#606e6e",
    "line-width": 8
  },
  "layout": {
    "line-join": "round",
    "line-cap": "round"
  },
  "filter": [
    "==",
    "id",
    "bridge_hafencity"
  ]
}

export const veddelUnderPassConfig: LayerSpecification = {
  "id": "underpass_veddel_north",
  "type": "line",
  "source": "bridges",
  "paint": {
    "line-color": "#606e6e",
    "line-width": 8
  },
  "layout": {
    "line-join": "round",
    "line-cap": "round"
  },
  "filter": [
    "==",
    "id",
    "underpass_veddel_north"
  ]
}
