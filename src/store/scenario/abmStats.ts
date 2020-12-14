import * as turf from '@turf/turf'
import store from '@/store'
// TODO: get from CityPyo
import FocusAreas from '@/assets/focus_areas.json'
import timePaths from '@/assets/timePaths.json'

const focusAreaFeatures = turf.featureCollection(FocusAreas["features"])
const grasbrookRegion = focusAreaFeatures.bbox // todo : is there no way to use UNION ?


function calculateAreaSizes() {
  let sizes = {}
  sizes["grasbrook"] = 10000 // todo : grasbrook size in m²??
  turf.featureEach(focusAreaFeatures, function (currentFocusArea, focusAreaIndex) {
    let currentSize = sizes[currentFocusArea["properties"]["focus_area_id"]] || 0
    sizes[currentFocusArea["properties"]["focus_area_id"]] = currentSize + turf.area(turf.multiPolygon(currentFocusArea.geometry.coordinates))
    }
  )

  return sizes
}

const focusAreaSizes = calculateAreaSizes()


export function clusterTimeData() {

  let pointCollection = createTimePathPointCollection(timePaths[0], 0)
  console.log("amount of points", pointCollection.features.length)

  console.log("clustering")
  let maxDistance = 0.001; // 50meters
  let clustered_db = turf.clustersDbscan(pointCollection, maxDistance);
  var options = {numberOfClusters: 5};
  let clustered_k = turf.clustersKmeans(pointCollection, options);
  console.log("clustered", clustered_db)

  // Calculate the total number of clusters
  var total = 0
  turf.clusterEach(clustered_db, 'cluster', function () {
    total++;
  });

  console.log("number of clusters db", total)

  // Calculate the total number of clusters
  var total_k = 0
  turf.clusterEach(clustered_k, 'cluster', function () {
    total++;
  });

  console.log("number of clusters k", total_k)



}


function createTimePathPointCollection(currentTimePaths, hour) {
  // create an array of Point objects from all points in the current hour of timePaths
  let pathPoints = Object.keys(currentTimePaths["values"]).map(coordinateString => {
    let coords = coordinateString.split(',').map(x => {
      return parseFloat(x)
    })
    return turf.point(coords, {"pedestrianCount": timePaths[hour]["values"][coordinateString]["weight"]})
  })

  return turf.featureCollection(pathPoints)
}


/* timePath object looks like this    *
 * TODO Example timePathObject
 * for every hour in timePaths
 * match the pedestrian counts to a region
 */
export function calculatePedestrianDensity() {
  console.log("calculating pedestrian density")
  let pedestrianCounts = {}
  for (const [hour, currentTimePaths] of Object.entries(timePaths)) {

    /* create an array of Point objects from all points in the current hour of timePaths
    let pathPoints = Object.keys(currentTimePaths["values"]).map(coordinateString => {
      let coords = coordinateString.split(',').map(x => {
        return parseFloat(x)
      })
      return turf.point(coords, {"pedestrianCount": timePaths[hour]["values"][coordinateString]["weight"]})
    })
     */

    // create featureCollection from pathPoints
    let pathPointCollection = createTimePathPointCollection(timePaths, hour)

    // iterate over all regions and find all pathPoints within the region
    focusAreaFeatures.features.forEach(region => {
      let matchedPoints = turf.pointsWithinPolygon(pathPointCollection, region)
      let currentPedCount = matchedPoints.features.reduce(getSum, 0)  // reduce matchedPoints features to a sum of its pedestrian count values
      pedestrianCounts[hour] = pedestrianCounts[hour] || {}
      let oldPedCount = pedestrianCounts[hour][region["properties"]["focus_area_id"]] || 0
      pedestrianCounts[hour][region["properties"]["focus_area_id"]] = oldPedCount + currentPedCount

      // filter out all points that are already matched to a region
      pathPointCollection.features = pathPointCollection.features.filter(function (pt) {
        return matchedPoints.features.every(matchedPoint => {
          return (matchedPoint.geometry.coordinates !== pt.geometry.coordinates)
        })
      })
    })

  }

  // compute density as amenityCount per area
  console.log(pedestrianCounts)
  let pedestrianDensity = {}
  for (const [hour, pedCounts] of Object.entries(pedestrianCounts)) {
    pedestrianDensity[hour] = {}
    for (const[area_key, count] of Object.entries(pedestrianCounts[hour]))
    pedestrianDensity[hour][area_key] = count / focusAreaSizes[area_key]
  }

  console.log("pedestrian density", pedestrianDensity)
}

function getSum(total, point) {
  // initial value is 0
  if (point === 0) {
    return total + point;
  }
  // get pedestrian count of point and add it
  return total + point["properties"]["pedestrianCount"];
}



/**
 * TODO : flexible areas
 *
 * calculate densitiy of non-residential amenities all over grasbrook and each focus area
 */
export function calculateDensityOfAmenities() {
  console.log("calculating amenity density")

  let amenities = store.state.scenario.amenitiesGeoJson
  let amenityDensity = {}
  let amenityCounts = {}

  // all amenities that are non-residential
  let amenitiesFeatures = turf.featureCollection(amenities["features"].filter(
    feature => (feature["properties"]["GFK"] > 2000))
  )

  // iterate over all amenities and find corresponding focus area
  turf.featureEach(focusAreaFeatures, function (currentFocusArea, focusAreaIndex) {
      let ptsWithin = turf.pointsWithinPolygon(amenitiesFeatures, turf.multiPolygon(currentFocusArea.geometry.coordinates));
      console.log("ptsWithin", ptsWithin)
      amenityCounts[currentFocusArea["properties"]["focus_area_id"]] = ptsWithin.features.length
  });
  amenityCounts["grasbrook"] = amenityCounts["grasbrook"] = amenitiesFeatures.features.length  // all of grasbrook

  // compute density as amenityCount per area
  for (const [key, amenityCount] of Object.entries(amenityCounts)) {
    amenityDensity[key] = amenityCount / focusAreaSizes[key]
  }

  return amenityDensity
}

/*
* calculating diversity index for amenities using the simpson index
* This is using the Simpson index - basically the probability of finding the same amenity type when picking 2 random
* amenities within a polygon.
* https://de.wikipedia.org/wiki/Simpson-Index
*/
export function calculateAmenityDiversity(forRegion= grasbrookRegion) {
  let amenities = store.state.scenario.amenitiesGeoJson
  let amenityTypeCounts = {}
  let amenityTypes = []

  // all amenities that are non-residential
  let amenitiesFeatures = turf.featureCollection(amenities["features"].filter(
    feature => (feature["properties"]["GFK"] > 2000))
  )

  // calculate total amount of amenity types
  turf.propEach(amenitiesFeatures, function (currentProperties, featureIndex) {
    if (!amenityTypes.includes(currentProperties.gfk)) {
      amenityTypes.push(currentProperties.gfk)
    }
  });
  let amenityTypesTotalCount = amenityTypes.length

  // calculate count for each amenity type in a certain region
  let amenitiesWithin = turf.pointsWithinPolygon(amenitiesFeatures, forRegion);
  for (let amenityType in amenityTypes) {
    let filteredAmenities =  turf.featureCollection(amenitiesWithin["features"].filter(
      feature => (feature["properties"]["GFK"] === amenityType))
    )
    amenityTypeCounts[amenityType] = filteredAmenities.length
  }

  // simpson: 1- SUM[(count/totalCount)²]
  let simpson = 1 - (Object.values(amenityTypeCounts).reduce((result: number, value: number) => {
    return result + Math.pow((value / amenityTypesTotalCount), 2)
  }, 0) as number)


  console.log("SIMPSON", simpson)
  return simpson
}


/**
 * filters the current Abm dataset by a region
 * data is inlcuded, if a on of the coordinates is in the region
 */
export function filterAbmDataByRegion() {
  console.log("test filter")
  let testPoint = turf.point(["10.01499", "53.53267"])
  let focusAreasFeatures = getFocusAreaGeoJson()

  console.log(focusAreasFeatures)
  console.log(focusAreasFeatures.features)

  // for each feature : Is the point in here?
  turf.featureEach(focusAreasFeatures, function (
    currentFeature, featureIndex
  ) {
    if (turf.booleanPointInPolygon(testPoint, turf.multiPolygon(currentFeature.geometry.coordinates))) {
      console.log("point in polygon", currentFeature["properties"]["focus_area_id"])
    }
  });
}


/**
 * filters the current Abm dataset by a region
 * data is inlcuded, if a on of the coordinates is in the region
 */
export function filterTimePathsByRegion() {
  console.log("filterTimePathsByRegion")
}

/**
 * Feature collection with MultiPolygons of FocusAreas
 * @return turf featureCollection
 */
function getFocusAreaGeoJson() {
  return turf.featureCollection(FocusAreas["features"])
}
