import * as turf from '@turf/turf'
import store from '@/store'

// debugging only
import NoiseResults from '@/assets/noise.json'
import abmStats from '@/assets/abmStats.json'
import amenityStats from '@/assets/amenityStats.json'
import FocusAreas from '@/assets/focusAreas.json'


/**
 * Filters the original dataset according to request
 * Scales all values onto a range of 0-100, to make comparible in front-end
 *
 * @param request
 */
export function filterAndScaleLayerData(request: LayerAnalysisRequest) {
  let layerData = createLayerData(request.layerName)
  let constraints = request.layerConstraints
  let range = request.layerRange

  layerData.features = layerData.features.filter(feature => {
      return constraints[0] <= feature.properties.value
        && feature.properties.value <= constraints[1]
    }
  )

  turf.featureEach(layerData, function(feature) {
    const value = feature.properties.value
    feature.properties["scaledValue"] = ((value - range[0]) / (range[1] - range[0])) * 100
  })

  return layerData
}

/**
 * @param layer_1
 * @param layer_2
 */
export function showMultiLayerAnalysis(layer_1, layer_2, logicOperator) {
  let combinedLayers = combineLayers(layer_1, layer_2, logicOperator)
  store.dispatch("scenario/addMultiLayerAnalysisLayer", combinedLayers)

  return combinedLayers;
}

/**
 * Creates a feature collection for the selected index
 *
 * @param layerName
 */
function createLayerData(layerName: string): turf.FeatureCollection<turf.Polygon | turf.MultiPolygon> {
  let baseDataSet = layerLookup[layerName]
  if (!baseDataSet) {
    console.warn("could not find baseDataSet for layerName ", layerName, "in multiLayerAnalysis")
    return
  }

  /** get layer data from noise layer*/
  // format noise data and return as featureCollection
  if (layerName === 'Noise Levels') {
    baseDataSet = baseDataSet[0]["geojson_result"]  // todo remove this, when getting noise from store.
    baseDataSet["features"].forEach((feature, featureId) => {
      feature.properties["value"] = noiseLookup[feature.properties["idiso"]]
      feature.properties["layerName"] = layerName
      feature.properties["id"] = featureId
    })
    return turf.featureCollection(baseDataSet["features"])
  }

  /** get layer data from abmStats or amenityStats*/
  // create featureCollection with focusAreas polygons and selected value
  let layerData = []
  for (const [focusAreaId, values] of Object.entries(baseDataSet)) {
    if (isNaN(parseInt(focusAreaId))) {
      continue
    }
    let feature = getGeometryForFocusArea(focusAreaId)
    // TODO refactor structure of abm results
    feature.properties = (baseDataSet === abmStats) ?
      {"value": values["original"][layerName]}
      : {"value": values[layerName]};
    feature.properties["layerName"] = layerName
    feature.properties["id"] = focusAreaId
    layerData.push(feature)
  }

  return turf.featureCollection(layerData)
}


/**
 * Combines 2 input layers
 * If logic operator == "and_not" ; the returned object includes all intersections of layer_1 and all polygons that
 * did not match the filter for layer_2
 *
 * @param layer_1
 * @param layer_2
 * @param logicOperator
 */
function combineLayers(layer_1, layer_2, logicOperator): turf.Feature[] {
  if (logicOperator === "and_not") {
    layer_2 = invertLayerFilter(layer_2)
  }

  const flattenedFeatures_1 = flattenFeatureCollection(layer_1)
  const flattenedFeatures_2 = flattenFeatureCollection(layer_2)

  return createLayerOfIntersections(flattenedFeatures_1, flattenedFeatures_2)
}

/**
 * iterate over unfiltered features
 * and keep all features that are not in the layerToInvert
 * @param layerToInvert
 */
function invertLayerFilter(layerToInvert) {
  const layerName = layerToInvert.features[0].properties.layerName
  let unfilteredData = createLayerData(layerName)
  let invertedData = []

  // iterate over unfiltered features and keep all features that are not in the layerToInvert
  unfilteredData.features.forEach(unfilteredFeature => {
    if (!layerToInvert.features.some(featureToIgnore => {
      return featureToIgnore.properties.id === unfilteredFeature.properties.id
    })) {
      invertedData.push(unfilteredFeature)
    }
  })

  return turf.featureCollection(invertedData)
}


/**
 * Creates a layer of all intersecting areas between the 2 input layers
 * Each intersection polygon has a property with a mean scaled value, calculated from the 2 input layers
 *
 * @param layer_1
 * @param layer_2
 */
function createLayerOfIntersections(layer_1, layer_2) {
  let combinedFeatures = []
  for (const feat_1 of layer_1) {
    for (const feat_2 of layer_2) {
      if (turf.booleanOverlap(feat_1, feat_2)) {
        const meanValue = (feat_1.properties["scaledValue"] + feat_2.properties["scaledValue"]) / 2
        // try creating new feature from intersection and meanValue
        try {
          combinedFeatures.push(turf.feature(
            turf.intersect(feat_1, feat_2).geometry,
            {
              "meanScaledValue": meanValue,
              layer_1_Name: feat_1.properties,
              layer_2_Name: feat_2.properties,
            }
          ))
        } catch (e) {
          console.warn("Error for one of layer intersections", e, feat_1, feat_2)
        }
      }
    }
  }
  return combinedFeatures
}

/**
 * Returns a MultiPolygon or Polygon that represents the Geometry of the focus area
 * @param focusAreaId
 */
function getGeometryForFocusArea(focusAreaId): turf.Feature<turf.Polygon> | turf.Feature<turf.MultiPolygon> {
  const polygons = focusAreas.features.filter(feature => {
    return feature.id == focusAreaId
  })

  console.log("polygons for focus area", focusAreaId, polygons)

  if (polygons.length ===1) {
    return turf.feature(polygons[0].geometry, {})
  }

  return turf.multiPolygon(polygons.map(polygon => {return polygon.geometry.coordinates}))
}

/**
 * Flattens all MultiPolygons in a feature Collection to an array of normal polygons
 * Returns an array of all polygons in feature collection
 *
 * @param featureCollection
 */
function flattenFeatureCollection(featureCollection) {
  let flattenedFeatures = []
  featureCollection.features.forEach(feature => {
    if (feature.geometry.type == "MultiPolygon") {
      turf.flatten(feature).features.forEach(flatFeat => {
        flattenedFeatures.push(flatFeat)
      })
    } else {
      flattenedFeatures.push(feature)
    }
  })

  return flattenedFeatures
}


const noiseLookup = [45,50,55,60,65,70,75,80,85]

// TODO const focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"]) as turf.FeatureCollection<turf.Polygon>
const focusAreas = turf.featureCollection(FocusAreas["features"]) as turf.FeatureCollection<turf.Polygon>

const layerLookup = {
'Noise Levels': NoiseResults,
'Amenity Types': amenityStats,
'Complementarity': amenityStats,
'Density': amenityStats,
'Diversity': amenityStats,
'opportunitiesOfInteraction': abmStats,
'pedestrianDensity': abmStats,
'temporalEntropyPercent': abmStats,
'averageDuration': abmStats,
'averageLength': abmStats

/** 'Noise Levels': store.state.scenario.currentNoiseGeoJson,
'Amenity Types': store.state.scenario.amenityStats,
'Complementarity': store.state.scenario.amenityStats,
'Density': store.state.scenario.amenityStats,
'Diversity': store.state.scenario.amenityStats,
'Opportunities for Interaction': store.state.scenario.abmStats,
'Pedestrian Density': store.state.scenario.abmStats,
'Temporal Entropy': store.state.scenario.abmStats,
'Trip Duration': store.state.scenario.abmStats,
'Trip Length': store.state.scenario.abmStats
 */
}


function saveFile(filename, obj) {
  const data = JSON.stringify(obj)
  const blob = new Blob([data], {type: 'text/plain'})
  const e = document.createEvent('MouseEvents'),
    a = document.createElement('a');
  a.download = filename + ".json";
  a.href = window.URL.createObjectURL(blob);
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
  e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
  a.dispatchEvent(e);
}


