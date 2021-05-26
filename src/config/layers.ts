import PerformanceInfosConfig from '@/config/performanceInfos.json'
import MultiLayerAnalysisConfig from '@/config/multiLayerAnalysis.json'
import LayerSubselectionConfig from '@/config/layerSubSelection.json'
import AmenitiesConfig from '@/config/amenities.json'
import BridgesConfig from '@/config/bridges.json'
import CircledFeatures from '@/config/circledFeatures.json'
import FocusAreasConfig from '@/config/focusAreas.json'
import Noise from '@/config/noise.json'
import WindResult from '@/config/windResult.json'
import SunExposure from '@/config/sunExposureResult.json'
import TrafficCounts from '@/config/trafficCounts.json'
import DesignConfigs from '@/config/buildings.json'
import SpacesConfig from '@/config/spaces.json'
import {abmArcLayerName,abmTripsLayerName, abmAggregationLayerName, swLayerName} from '@/store/deck-layers'


const addedLayersIds = [
  LayerSubselectionConfig.layer.id,
  WindResult.layer.id,
  SunExposure.layer.id,
  Noise.layer.id,
  TrafficCounts.layer.id,
  abmAggregationLayerName,
  abmTripsLayerName,
  abmArcLayerName,
  swLayerName,
  MultiLayerAnalysisConfig.layer.id,
  PerformanceInfosConfig.layer.id,
  CircledFeatures.layer.id,
]

const buildingLayerIds = DesignConfigs.layers.map(layer => {
  return layer.id
})

const bridgeLayerIds = BridgesConfig.layers.map(layer => {
  return layer.id
})

export function getLayerOrder() {
  let layerOrder = [
    FocusAreasConfig.layer.id,
    SpacesConfig.layer.id,
    AmenitiesConfig.layer.id,
  ]

  layerOrder = layerOrder.concat(bridgeLayerIds)
  layerOrder = layerOrder.concat(buildingLayerIds)
  layerOrder = layerOrder.concat(addedLayersIds)

  console.log("layerOrder", layerOrder)

  return layerOrder
}

export function getAbmLayerIds() {
  let abmLayers = []
  abmLayers = abmLayers.concat(buildingLayerIds)
  abmLayers = abmLayers.concat([abmAggregationLayerName, abmTripsLayerName, abmArcLayerName])
  abmLayers.push(AmenitiesConfig.layer.id)

  return abmLayers
}



