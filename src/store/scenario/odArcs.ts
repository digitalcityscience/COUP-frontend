import store from "@/store";
import * as turf from "@turf/turf";
import Trips from "@/assets/trips.json";
import AmenitiesGeoJson from "@/assets/amenities.json";

export function getOdArcData(objectData, modalInfo, asOrigin: boolean) {
  let amenityPoints = getAmenityPoints(objectData, modalInfo)
  let odPointCollection = getOdPointCollection(asOrigin)
  let arcLayerData = []

  // get data for the arc layer for each of the amenity points
  turf.featureEach(amenityPoints, function (amenityPoint:turf.Feature) {
    // filter odPoints for those that are adjacent to the amenity
    let filteredOdPoints = []
    turf.featureEach(odPointCollection, function (odPoint) {
      // @ts-ignore
      if (turf.distance(amenityPoint, odPoint) < 0.01) {
        filteredOdPoints.push(odPoint)
      }
    })
    arcLayerData.push(...formatDataPoints(filteredOdPoints, amenityPoint, asOrigin))
  })

  return arcLayerData
}

function getAmenityPoints(objectData, modalInfo): turf.FeatureCollection {
  if (modalInfo.objectType === 'amenity') {  // todo adjust after having amenity ids in ABM results
    // clicked on simple amenity. Use this as point
    return (turf.featureCollection([turf.point(modalInfo["coords"])])) as turf.FeatureCollection
  } else {
    // clicked on a building, find adjacent amenities
    return findAdjacentAmenities(objectData)
  }
}


/** creates a point feature collection of all trips origins or destinations */
function getOdPointCollection(useOrigins: boolean): turf.FeatureCollection {
  let trips = JSON.parse(JSON.stringify(Trips)) // todo from store

  return turf.featureCollection(trips.map((trip) => {
    if (useOrigins) {
      return turf.point(trip["origin"], {"trip": trip})
    } else {
      return turf.point(trip["destination"], {"trip": trip})
    }
  }))
}

/** finds amenities located within a buffer of a building outline */
export function findAdjacentAmenities(objectData): turf.FeatureCollection {
    let groundFloorData = objectData.filter(buildingInLayer => {
      return buildingInLayer.layer.id === "groundfloor";
    })[0]

    if (!groundFloorData) {
      return null
    }

    let buildingPolygon = turf.buffer(turf.polygon(groundFloorData.geometry.coordinates), 0.015)
    let amenities = turf.featureCollection((AmenitiesGeoJson["features"]))

    return turf.pointsWithinPolygon(amenities, buildingPolygon)
  }

function formatDataPoints(filteredOdPoints, amenityPoint, asOrigin:boolean): GenericObject[] {
  let data = []
  filteredOdPoints.forEach(pt => {
    const from = asOrigin ? amenityPoint.geometry.coordinates : pt.properties.trip.origin
    const to = asOrigin ? pt.properties.trip.destination : amenityPoint.geometry.coordinates

    // todo , update input dataset to have proper amenity ids, also in origin/destinations
    const width = filteredOdPoints.filter(point => {
      const counterPoint = asOrigin ? to : from
      const pointCoords = asOrigin ? point.properties.trip.destination : point.properties.trip.origin

      return ((counterPoint[0] === pointCoords[0])
        && (counterPoint[1] === pointCoords[1]))
    }).length + 1

    data.push({
      "color": [254, 227, 81],
      "source": from,
      "target": to,
      "width": width
    })
  })
  return data
}


