import store from "@/store";
import * as turf from "@turf/turf";
import FocusAreas from "@/assets/focus_areas.json";


const focusAreaSizes = calculateAreaSizes()
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
    if (!amenityTypes.includes(currentProperties["GFK"])) {
      amenityTypes.push(currentProperties["GFK"])
    }
  });
  let amenityTypesTotalCount = amenityTypes.length

  console.log(forRegion)

  // calculate count for each amenity type in a certain region
  let amenitiesWithin = turf.pointsWithinPolygon(amenitiesFeatures, forRegion);
  for (let amenityType of amenityTypes) {
    let filteredAmenities = amenitiesWithin.features.filter(
      feature => (feature["properties"]["GFK"] === amenityType))

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
 * data is inlcuded, if a one of the coordinates is in the region
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
