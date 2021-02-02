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

 /**  calculate mean values and combine results
 *          -> mean scaled values ((65dB noise in range of 45-85 -> 66% ) + scaledPedestrianDensity) /2
 *          ---> see if scaled values need to be inversed. the higher the better?
 *          apply color range to  mean values
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
 *
 * @param layer_1
 * @param layer_2
 */
export function showMultiLayerAnalysis(layer_1, layer_2) {
  let combinedLayers = combineLayers(layer_1, layer_2)
  store.dispatch("scenario/addMultiLayerAnalysisLayer", combinedLayers)

  console.log(combinedLayers)

  return combinedLayers;

  /*saveFile("combinedLayers",
    {
      "type": "FeatureCollection",
      "features": combinedLayers
    }
    )*/
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
    baseDataSet["features"].forEach(feature => {
      feature.properties["value"] = noiseLookup[feature.properties["idiso"]]
      feature.properties["layerName"] = layerName
    })
    return turf.featureCollection(baseDataSet["features"])
  }

  /** get layer data from abmStats or amenityStats*/
  // create featureCollection with focusAreas polygons and selected value
  let layerData = turf.featureCollection([])
  for (const [focusAreaId, values] of Object.entries(baseDataSet)) {
    if (isNaN(parseInt(focusAreaId))) {
      console.log("skipping this")
      continue
    }
    let feature = getGeoFeatureForFocusArea(focusAreaId)
    // TODO refactor structure of abm results
    feature.properties = (baseDataSet === abmStats) ?
      {"value": values["original"][layerName]}
      : {"value": values[layerName]};
    feature.properties["layerName"] = layerName
    layerData.features.push(feature)
  }
  console.log("layer data",  layerData)

  return layerData
}



function combineLayers(layer_1, layer_2): turf.Feature[] {
  const flattenedFeatures_1 = flattenFeatureCollection(layer_1)
  const flattenedFeatures_2 = flattenFeatureCollection(layer_2)

  let combinedFeatures = []

  console.log("flat 1", flattenedFeatures_1)
  console.log("flat 2", flattenedFeatures_2)

  for (const flatFeat_1 of flattenedFeatures_1) {
    for (const flatFeat_2 of flattenedFeatures_2) {
      if (turf.booleanOverlap(flatFeat_1, flatFeat_2)) {
        const meanValue = (flatFeat_1.properties["scaledValue"] + flatFeat_2.properties["scaledValue"]) / 2
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


function getGeoFeatureForFocusArea(focusAreaId): turf.Feature<turf.Polygon> | turf.Feature<turf.MultiPolygon> {
  const polygons = focusAreas.features.filter(feature => {
    return feature.id == focusAreaId
  })

  console.log("polygons for focus area", focusAreaId, polygons)

  if (polygons.length ===1) {
    return turf.feature(polygons[0].geometry, {})
  }

  return turf.multiPolygon(polygons.map(polygon => {return polygon.geometry.coordinates}))
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


