import * as turf from '@turf/turf'
import store from '@/store'


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


  console.log("layerName, Range", request)

  layerData.features = layerData.features.filter(feature => {
      return constraints[0] <= feature.properties.value
        && feature.properties.value <= constraints[1]
    }
  )

  turf.featureEach(layerData, function(feature) {
    const value = feature.properties.value
    feature.properties["scaledValue"] = ((value - range[0]) / (range[1] - range[0])) * 100
  })


  console.log("layerdata", layerData)

  return layerData
}

/**
 * @param layer_1
 * @param layer_2
 */
export function showMultiLayerAnalysis(layer_1, layer_2, logicOperator) {
  const combinedLayerFeatures = combineLayers(layer_1, layer_2, logicOperator)
  store.dispatch("scenario/addMultiLayerAnalysisLayer", combinedLayerFeatures)

  const performanceInfos = createPerformanceInfos(combinedLayerFeatures)
  store.dispatch("scenario/addMultiLayerPerformanceInfos", performanceInfos)

  return combinedLayerFeatures;
}

/**
 * Creates a feature collection for the selected index
 *
 * @param layerName
 */
function createLayerData(layerName: string): turf.FeatureCollection<turf.Polygon | turf.MultiPolygon> {
  let baseDataSet = layerLookup(layerName)

  /** get layer data from noise layer*/
  // format noise data and return as featureCollection
  if (layerName === 'noise') {
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
    feature.properties = {"value": values[layerName]};
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

function createPerformanceInfos(combinedFeatures: turf.Feature[]) {
  let infos = []
  combinedFeatures.forEach(feat => {
    const lowOrHigh_1 = isLowOrHighValue(feat.properties.layer1)
    const lowOrHigh_2 = isLowOrHighValue(feat.properties.layer2)

    if (lowOrHigh_1 && lowOrHigh_2) {
      let info = turf.centroid(feat,
        {
          "shortInfoText":
           feat.properties.layer1.layerName + " level: " + lowOrHigh_1 + " \n"
           + feat.properties.layer2.layerName + " level: " + lowOrHigh_2
          ,
          "infoText":
          "This area has a " + lowOrHigh_1 + " " + feat.properties.layer1.layerName + " level " +
          "combined with a " + lowOrHigh_2 + " " + feat.properties.layer2.layerName + " level"
        }
      )
      infos.push(info)
    }
  })

  return infos
}


/**
 * TODO - statistical high/lows
 *
 * Returns "high" , "low" or null , depending on the scaled value (always scaled to 0-100)
 * @param props
 */
function isLowOrHighValue(props): string | null {
  if (props.scaledValue >= 64) {
    return "high"
  }
  if (props.scaledValue <= 20) {
    return "low"
  }

  return null
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
 * @param layer_1_features
 * @param layer_2_features
 */
function createLayerOfIntersections(layer_1_features, layer_2_features) {
  let combinedFeatures = []
  for (const feat_1 of layer_1_features) {
    for (const feat_2 of layer_2_features) {
      const featureIntersection = findFeatureIntersection(feat_1, feat_2)
      if (featureIntersection) {
        const meanValue = (feat_1.properties["scaledValue"] + feat_2.properties["scaledValue"]) / 2
        // try creating new feature from intersection and meanValue
        featureIntersection.properties = {
          "meanScaledValue": meanValue,
          "layer1": feat_1.properties,
          "layer2": feat_2.properties,
        }
        combinedFeatures.push(featureIntersection)
      }
    }
  }
  return combinedFeatures
}

/**
 * Creates a simplified version of the features and looks for an intersection
 * If simplified features intersect return a turf.Feature for the intersection area.
 *
 * @param feat_1
 * @param feat_2
 */
function findFeatureIntersection(feat_1, feat_2): turf.Feature | null {
  const simplifyingOptions = {tolerance:0.02, highQuality: false};
  const simplifiedFeatures = [
    turf.buffer(turf.simplify(JSON.parse(JSON.stringify(feat_1)), simplifyingOptions), 0.2, {"steps": 8} ),
    turf.buffer(turf.simplify(JSON.parse(JSON.stringify(feat_2)), simplifyingOptions), 0.2, {"steps": 8})
  ]

  // if the simplified features overlap, take a closer look and return if the real features overlap
  if (turf.booleanOverlap(simplifiedFeatures[0], simplifiedFeatures[1])) {
    try {
      return turf.intersect(feat_1, feat_2)
    } catch (e) {
      console.warn("Error for one of layer intersections", e, feat_1, feat_2)
    }
  }
  return null
}

/**
 * Returns a MultiPolygon or Polygon that represents the Geometry of the focus area
 * @param focusAreaId
 */
function getGeometryForFocusArea(focusAreaId): turf.Feature<turf.Polygon> | turf.Feature<turf.MultiPolygon> {
  const focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"]) as turf.FeatureCollection<turf.Polygon>
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

const noiseLookup = [45,50,55,60,65,70,75,80]

/**
 * return dataset for layer
 * @param layerName
 */
function layerLookup(layerName:string) {
  switch (layerName) {
    case 'noise':
      return store.state.scenario.currentNoiseGeoJson
    case 'Density':
    case 'Amenity Types':
      return store.state.scenario.amenityStatsMultiLayer
    case 'pedestrianDensity':
      return store.state.scenario.abmStatsMultiLayer
    default:
        console.warn("could not find baseDataSet for layerName", layerName, "in multiLayerAnalysis")
        break;
  }
}
