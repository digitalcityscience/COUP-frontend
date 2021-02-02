import * as turf from '@turf/turf'
import store from '@/store'

// debugging only
import NoiseResults from '@/assets/noise.json'
import abmStats from '@/assets/abmStats.json'
import amenityStats from '@/assets/amenityStats.json'
import FocusAreas from '@/assets/focusAreas.json'


/** get selected results
 * filter results for slider values
 * identify logic operation
 *      -> calculate mean values and combine results
 *          -> mean scaled values ((65dB noise in range of 45-85 -> 66% ) + scaledPedestrianDensity) /2
 *          ---> see if scaled values need to be inversed. the higher the better?
 *          apply color range to  mean values
 *
 *          */


/**



/**
 *
 * @param request: MultiLayerAnalysisRequest
 */
export function showMultiLayerAnalysis(request: MultiLayerAnalysisRequest) {
  // get layer data
  let layer_1 = createLayerData(request.layer_1_Name)
  let layer_2 = createLayerData(request.layer_2_Name)

  // filter and scale layer data
  filterAndScaleLayerData(layer_1, request.layer_1_Range, request.layer_1_Constraints);
  filterAndScaleLayerData(layer_2, request.layer_2_Range, request.layer_2_Constraints);

  // combine layers
  let combinedLayers = combineLayers(layer_1, layer_2, request.layer_1_Name, request.layer_2_Name)
  store.dispatch("scenario/addMultiLayerAnalysisLayer", combinedLayers)

  console.log(combinedLayers)


  saveFile("combinedLayers",
    {
      "type": "FeatureCollection",
      "features": combinedLayers
    }
    )
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

  // format noise data and return as featureCollection
  if (layerName === 'Noise Levels') {
    baseDataSet = baseDataSet[0]["geojson_result"]
    baseDataSet["features"].forEach(feature => {
    // todo use this , when using noise from store . baseDataSet["features"].forEach(feature => {
      feature.properties["value"] = noiseLookup[feature.properties["idiso"]]
    })
    return turf.featureCollection(baseDataSet["features"])
  }


  console.log("baseData", baseDataSet)

  // create featureCollection with focusAreas polygons and selected value
  let layerData = turf.featureCollection([])
  for (const [focusAreaId, values] of Object.entries(baseDataSet)) {
    if (isNaN(parseInt(focusAreaId))) {
      console.log("skipping this")
      continue
    }


    let feature = getPolygonForFocusArea(focusAreaId)
    // TODO refactor structure of abm results
    if (baseDataSet === abmStats) {
      feature.properties = {"value": values["original"][layerName]}
    } else {
      feature.properties = {"value": values[layerName]}
    }

    layerData.features.push(feature)
  }
  console.log("layer data",  layerData)

  return layerData
}


/**  calculate mean values and combine results
*          -> mean scaled values ((65dB noise in range of 45-85 -> 66% ) + scaledPedestrianDensity) /2
*          ---> see if scaled values need to be inversed. the higher the better?
*          apply color range to  mean values
*/
function filterAndScaleLayerData(layerData: turf.FeatureCollection<turf.Polygon|turf.MultiPolygon>, range, constraints) {
  layerData.features = layerData.features.filter(feature => {
      return constraints[0] <= feature.properties.value
        && feature.properties.value <= constraints[1]
    }
  )

  turf.featureEach(layerData, function(feature) {
    const value = feature.properties.value
    feature.properties["scaledValue"] = ((value - range[0]) / (range[1] - range[0])) * 100
  })
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

function combineLayers(layer_1, layer_2, layer_1_Name, layer_2_Name): turf.Feature[] {
  const flattenedFeatures_1 = flattenFeatureCollection(layer_1)
  const flattenedFeatures_2 = flattenFeatureCollection(layer_2)

  let combinedFeatures = []

  console.log("flat 1", flattenedFeatures_1)
  console.log("flat 2", flattenedFeatures_2)

  for (const flatFeat_1 of flattenedFeatures_1) {
    for (const flatFeat_2 of flattenedFeatures_2) {
      if (turf.booleanOverlap(flatFeat_1, flatFeat_2)) {
        const meanValue = (flatFeat_1.properties["scaledValue"] + flatFeat_2.properties["scaledValue"]) / 2
        flatFeat_1.properties["layerName"] = layer_1_Name
        flatFeat_2.properties["layerName"] = layer_2_Name

        // try creating new feature from intersection and meanValue
        try {
        combinedFeatures.push(turf.feature(
          turf.intersect(flatFeat_1, flatFeat_2).geometry,
          {
            "meanScaledValue": meanValue,
            layer_1_Name: flatFeat_1.properties,
            layer_2_Name: flatFeat_2.properties,
          }
        ))
        } catch (e) {
          console.warn("Error for one of layer intersections", e, flatFeat_1, flatFeat_2)
        }
      }
    }
  }
  return combinedFeatures
}


function getPolygonForFocusArea(focusAreaId): turf.Feature<turf.Polygon> | turf.Feature<turf.MultiPolygon> {
  const polygons = focusAreas.features.filter(feature => {
    return feature.id == focusAreaId
  })

  console.log("polygons for focus area", focusAreaId, polygons)

  if (polygons.length ===1) {
    return turf.feature(polygons[0].geometry, {})
  }

  return turf.multiPolygon(polygons.map(polygon => {return polygon.geometry.coordinates}))
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


