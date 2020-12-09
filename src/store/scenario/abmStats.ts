import * as turf from '@turf/turf'
import store from '@/store'
// TODO: get from CityPyo
import FocusAreas from '@/assets/focus_areas.json'


const focusAreaFeatures = turf.featureCollection(FocusAreas["features"])

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

/**
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
