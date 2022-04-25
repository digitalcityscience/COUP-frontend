import GrasbrookGeoJson from "@/assets/grasbrookArea.json";
import store from "@/store";
import * as turf from "@turf/turf";

/** calculates stats for all focus areas individually **/
export async function calculateAmenityStatsForMultiLayerAnalysis() {
  const amenityStats = {};

  const focusAreaIds = store.state.focusAreasGeoJson["features"].map((feat) => {
    return feat.id;
  });

  for (const focusAreaId of focusAreaIds) {
    amenityStats[focusAreaId] = {};
    if (!store.getters["abm/amenityStats"].focusAreaId) {
      const focusArea = getFocusAreaAsTurfObject(focusAreaId);
      const amenitiesFeatures = getFeatureCollectionOfNonResidentialAmenities();
      const amenitiesWithin = turf.pointsWithinPolygon(
        amenitiesFeatures,
        focusArea
      ); // amenities within focus area
      amenityStats[focusAreaId]["Density"] = calculateDensityOfAmenities(
        amenitiesWithin,
        focusArea
      );
      amenityStats[focusAreaId]["Amenity Types"] =
        getAmenityTypes(amenitiesWithin).length;
    } else {
      amenityStats[focusAreaId]["Density"] =
        store.getters["amenityStats"][focusAreaId]["Density"];
      amenityStats[focusAreaId]["Amenity Types"] =
        store.getters["amenityStats"][focusAreaId]["Amenity Types"];
    }
  }

  store.commit("abm/mutateAmenityStatsMultiLayer", amenityStats);
}

function getFocusAreaAsTurfObject(focusAreaId?: number) {
  const focusAreas = turf.featureCollection(
    store.state.focusAreasGeoJson["features"]
  ) as turf.FeatureCollection<turf.Polygon>;

  if (focusAreaId) {
    focusAreas.features = focusAreas.features.filter((feature) => {
      return feature.id == focusAreaId;
    });
  } else {
    // take the entire grasbrook
    const grasbrook = GrasbrookGeoJson as turf.GeoJSONObject;
    focusAreas.features = grasbrook["features"];
  }

  return focusAreas;
}

/** calculates stats for 1 focus area or entire grasbrook as a single big area **/
export async function calculateAmenityStatsForFocusArea(
  focusAreaId?: number
): Promise<void> {
  if (!store.getters["abm/abmAmenitiesGeoJSON"]) {
    console.log("cannot calc amenity stats - no amenityGeoJson in store!");
    return;
  }

  console.log("calc amenity stats");
  //let focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"])
  const focusAreas = getFocusAreaAsTurfObject(focusAreaId);
  const amenitiesFeatures = getFeatureCollectionOfNonResidentialAmenities();
  const amenitiesWithin = turf.pointsWithinPolygon(
    amenitiesFeatures,
    focusAreas
  ); // amenities within focus area

  const diversity = calculateAmenityDiversity(
    amenitiesFeatures,
    amenitiesWithin
  );
  const density = calculateDensityOfAmenities(amenitiesWithin, focusAreas);
  const amenityTypesRegion = getAmenityTypes(amenitiesWithin).length;
  const complementarity = calculateComplementarity(amenitiesWithin);

  const results = {
    Diversity: diversity,
    "Amenity Types": amenityTypesRegion,
    Density: density,
    Complementarity: complementarity,
  };
  const amenityStats = store.getters["amenityStats"] || {};

  const id = focusAreaId || "grasbrook";
  amenityStats[id] = results;
  amenityStats["units"] = [
    "Simpson Index",
    "unique place types",
    "places/km²",
    "complementary trips",
  ];

  store.commit("abm/mutateAbmStats", amenityStats);
  console.log("commited amenity stats to store", amenityStats);
  store.commit("scenario/updateAmenityStatsChart", true);
}

/**
 * Returns a Point collection of all non-residential amenities
 *
 * @returns FeatureCollection<Point>
 */
function getFeatureCollectionOfNonResidentialAmenities(): turf.FeatureCollection<turf.Point> {
  const amenities = store.getters["abm/abmAmenitiesGeoJSON"] as turf.GeoJSONObject;

  // all amenities that are non-residential
  return turf.featureCollection(
    amenities["features"].filter(
      (feature) => feature["properties"]["GFK"] > 2000
    )
  );
}

/**
 * Return count of amenities where an amenity is destination and also origin of the trips of one same agent
 * @param amenitiesWithin
 */
function calculateComplementarity(
  amenitiesWithin: turf.FeatureCollection<turf.Point>
) {
  const abmTrips = store.getters["abm/abmTripsSummary"];

  if (amenitiesWithin.features.length === 0) {
    // no amenities in the area
    return 0;
  }

  let complementaryAmenitiesCount = 0;

  // get all agents in abmTrips
  const agentNames = [...new Set(abmTrips.map((item) => item["agent"]))];

  // filter abmTrips with agentName
  for (const agent of agentNames) {
    const agentTrips = abmTrips.filter((trip) => {
      return trip["agent"] === agent;
    });

    // consider only agents with more than 1 trip
    if (agentTrips.length < 2) {
      continue;
    }

    // count times where the agent has an amenity as destination and also origin
    for (const trip of agentTrips) {
      const destinationPoint = turf.point(trip["destination"]);
      // if destination is direct vincinity to one of the amenities.
      const closestAmenityToDestination = turf.nearestPoint(
        destinationPoint,
        amenitiesWithin
      );
      if (turf.distance(destinationPoint, closestAmenityToDestination) < 50) {
        // now check if this amenity is also origin of another trip of the agent

        // get the origin points of the other trips of the agent
        const originPoints = agentTrips
          .filter((filterTrip) => {
            return (
              filterTrip["origin"].toString() !== trip["origin"].toString()
            );
          })
          .map((mapTrip) => {
            return turf.point(mapTrip["origin"]);
          });

        for (const originPoint of originPoints) {
          if (turf.distance(originPoint, closestAmenityToDestination) < 50) {
            complementaryAmenitiesCount += 1;
            break;
          }
        }
      }
    }
  }

  return complementaryAmenitiesCount;
}

/**
 * calculate density of non-residential amenities all over grasbrook and each focus area
 */
export function calculateDensityOfAmenities(
  amenitiesWithin,
  forRegion
): number {
  const amenityCount = amenitiesWithin.features.length;

  console.log("amenities count", amenityCount);
  console.log("area", turf.area(forRegion) / (1000 * 1000));

  return Math.round(amenityCount / (turf.area(forRegion) / (1000 * 1000))); // in count / km²
}

/**
 * calculating diversity index for amenities using the simpson index
 * This is using the Simpson index - basically the probability of finding the same amenity type when picking 2 random
 * amenities within a polygon.
 * https://de.wikipedia.org/wiki/Simpson-Index
 */
export function calculateAmenityDiversity(grasbrookAmenities, amenitiesWithin) {
  if (amenitiesWithin.features.length === 0) {
    // no amenities , no diversity
    return 0;
  }

  /*calculating diversity with simpson index*/
  const amenityCountInRegion = amenitiesWithin.features.length;
  const amenityTypeCounts = {};
  const possibleTypes = getAmenityTypes(grasbrookAmenities);

  for (const amenityType of possibleTypes) {
    const amenitiesWithCurrentType = amenitiesWithin.features.filter(
      (feature) => feature["properties"]["GFK"] === amenityType
    );
    if (amenitiesWithCurrentType.length > 0) {
      amenityTypeCounts[amenityType] = amenitiesWithCurrentType.length;
    }
  }

  // simpson: 1- SUM[(count/totalCount)²]
  const simpson =
    1 -
    (Object.values(amenityTypeCounts).reduce(
      (result: number, typeCount: number) => {
        return (
          result +
          (typeCount * (typeCount - 1)) /
            (amenityCountInRegion * (amenityCountInRegion - 1))
        );
      },
      0
    ) as number);

  console.log("SIMPSON", simpson);
  return Math.round(simpson * 100);
}

function getAmenityTypes(amenities) {
  // calculate total amount of amenity types
  const amenityTypes = [];
  // TODO: this is using the entire grasbrook to calculate amenityTypesTotalCount - or should that be compared to the region??
  turf.propEach(amenities, function (currentProperties, featureIndex) {
    if (!amenityTypes.includes(currentProperties["GFK"])) {
      amenityTypes.push(currentProperties["GFK"]);
    }
  });
  return amenityTypes;
}
