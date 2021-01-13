import store from "@/store";
import * as turf from "@turf/turf";
import GrasbrookGeoJson from "@/assets/grasbrookArea.json";


export function calculateAmenityStatsForFocusArea(focusAreaId?: number) {
  if (!store.state.scenario.amenitiesGeoJson) {
    console.log("cannot calc amenity stats - no amenityGeoJson in store!")
    return
  }

  console.log("calc amenity stats")
  //let focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"])
  let focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"])

  if (focusAreaId) {
    focusAreas.features = focusAreas.features.filter(feature => {
      return feature.id == focusAreaId
    })
  } else {
    // take the entire grasbrook
    focusAreas.features = GrasbrookGeoJson["features"]
  }

  let amenitiesFeatures = getFeatureCollectionOfNonResidentialAmenities()
  let amenitiesWithin = turf.pointsWithinPolygon(amenitiesFeatures, focusAreas); // amenities within focus area

  let diversity = calculateAmenityDiversity(amenitiesFeatures, amenitiesWithin)
  let density = calculateDensityOfAmenities(amenitiesWithin, focusAreas)
  let amenityTypesRegion = getAmenityTypes(amenitiesWithin).length
  let complementarity = calculateComplementarity(amenitiesWithin)

  let results = {
    "Diversity": diversity,
    "Density": density,
    "Complementarity": complementarity,
    "typesCount": amenityTypesRegion
  }
  let amenityStats = store.state.scenario.amenityStats || {}

  const id = focusAreaId || "grasbrook"
  amenityStats[id] = results
  amenityStats["units"] = ["Simpson Index", "places/km²", "complementary trips", "place types"]

  store.commit("scenario/amenityStats", amenityStats)
  console.log("commited amenity stats to store", amenityStats)
  store.commit("scenario/updateAmenityStatsChart", true)
  store.commit("scenario/loader", false)
}

/**
 * Returns a Point collection of all non-residential amenities
 *
 * @returns FeatureCollection<Point>
 */
function getFeatureCollectionOfNonResidentialAmenities() {
  let amenities = store.state.scenario.amenitiesGeoJson

  // all amenities that are non-residential
  let amenitiesFeatures = turf.featureCollection(amenities["features"].filter(
    feature => (feature["properties"]["GFK"] > 2000))
  )

  return amenitiesFeatures
}


/**
 * Return count of amenities where an amenity is destination and also origin of the trips of one same agent
 * @param amenitiesWithin
 */
function calculateComplementarity(amenitiesWithin: FeatureCollection<Point>) {
  const abmTrips = store.state.scenario.abmTrips

  if (amenitiesWithin.features.length === 0) {
    // no amenities in the area
    return 0
  }

  let complementaryAmenitiesCount = 0

  // get all agents in abmTrips
  const agentNames = [...new Set(abmTrips.map(item => item["agent"]))];

  // filter abmTrips with agentName
  for (const agent of agentNames) {
    const agentTrips = abmTrips.filter(trip => {
      return trip["agent"] === agent
    })

    // consider only agents with more than 1 trip
    if (agentTrips.length < 2) {
      continue
    }

    // count times where the agent has an amenity as destination and also origin
    for (const trip of agentTrips) {
      let destinationPoint = turf.point(trip["destination"])
      // if destination is direct vincinity to one of the amenities.
      let closestAmenityToDestination = turf.nearestPoint(destinationPoint, amenitiesWithin)
      if (turf.distance(destinationPoint, closestAmenityToDestination) < 50) {
        // check if this amenity is also origin of a trip of the agent
        let originPoint = turf.point(trip["origin"])
        if (turf.distance(originPoint, closestAmenityToDestination) < 50) {
          complementaryAmenitiesCount += 1
        }
      }
    }
  }

  return complementaryAmenitiesCount
}

/**
* calculate density of non-residential amenities all over grasbrook and each focus area
*/
export function calculateDensityOfAmenities(amenitiesWithin, forRegion) {
  let amenityCount = amenitiesWithin.features.length

  console.log("amenities count", amenityCount)
  console.log("area", turf.area(forRegion) / (1000*1000))

  return Math.round(amenityCount / (turf.area(forRegion) / (1000*1000) )) // in count / km²
}

/**
  * calculating diversity index for amenities using the simpson index
  * This is using the Simpson index - basically the probability of finding the same amenity type when picking 2 random
  * amenities within a polygon.
  * https://de.wikipedia.org/wiki/Simpson-Index
*/
export function calculateAmenityDiversity(grasbrookAmenities, amenitiesWithin) {

  /*calculating diversity with simpson index*/

  // TODO calculate for region only instead?? Simpson value in the end is highler if none of the species is there?


  let amenityTypeCounts = {}
  let amenityTypesGrasbrook = getAmenityTypes(grasbrookAmenities)


  for (let amenityType of amenityTypesGrasbrook) {
    let filteredAmenities = amenitiesWithin.features.filter(
      feature => (feature["properties"]["GFK"] === amenityType)
    )
    amenityTypeCounts[amenityType] = filteredAmenities.length
  }

  // simpson: 1- SUM[(count/totalCount)²]
  let simpson = 1 - (Object.values(amenityTypeCounts).reduce((result: number, value: number) => {
    //return result + Math.pow((value / amenityTypesGrasbrook.length), 2)
    return result + (value * (value - 1)) / (amenityTypesGrasbrook.length * (amenityTypesGrasbrook.length -1))
  }, 0) as number)

  console.log("SIMPSON", simpson)
  return Math.round(simpson * 100)
}

function getAmenityTypes(amenities) {
  // calculate total amount of amenity types
  let amenityTypes = []
  // TODO: this is using the entire grasbrook to calculate amenityTypesTotalCount - or should that be compared to the region??
  turf.propEach(amenities, function (currentProperties, featureIndex) {
    if (!amenityTypes.includes(currentProperties["GFK"])) {
      amenityTypes.push(currentProperties["GFK"])
    }
  });
  return amenityTypes
}
