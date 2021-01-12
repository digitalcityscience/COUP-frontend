import * as turf from '@turf/turf'
import store from '@/store'

import GrasbrookArea from '@/assets/grasbrook_area.json'  // TODO: get from CityPyo
import FocusAreas from '@/assets/focus_areas.json'  // TODO: get from CityPyo
const grasbrookRegion = turf.featureCollection(GrasbrookArea["features"])


export function calculateAbmStatsForFocusArea(focusAreaId?: number) {
  console.log("focusarea", focusAreaId)
  //let focusAreas = turf.featureCollection(store.state.focusAreasGeoJson["features"])
  let focusAreas = turf.featureCollection(FocusAreas["features"])


  if (focusAreaId) {
    focusAreas.features = focusAreas.features.filter(feature => {
      return feature.id == focusAreaId
    })
  }

  let results = calculatePedestrianIndices(focusAreas)
  let abmStats = store.state.scenario.abmStats || {
                    "units": ["pedestrians/m²", "%","interactions/m²", "minutes", "meters"],
  }

  const id = focusAreaId || "grasbrook"
  abmStats[id] = results

  store.commit("scenario/abmStats", abmStats)
  console.log("commited abmStats to store")
  store.commit("scenario/updateRadarChart", true)
  store.commit("scenario/loader", false)
}


/*
 * Filter timePaths for all path-points within the region
 * Compute stats based on pedestrian counts in region (hour for hour)
 * timePath object looks like this  TODO: example
 */
function calculatePedestrianIndices(forRegion = grasbrookRegion) {
  console.log("calculating pedestrian indices")
  let pedestrianCountsPerHour = {}
  let matchedPointsPerHour = {}  // collection of Points with active agents within the investigation region

  for (const [hour, currentTimePaths] of Object.entries(store.state.scenario.abmTimePaths)) {
    // create featureCollection from pathPoints
    let pathPointCollection = createPathPointCollection(currentTimePaths)

    // find all pathPoints within the region
    let matchedPoints = turf.pointsWithinPolygon(pathPointCollection, forRegion)
    let currentPedCount = matchedPoints.features.reduce(getSumOfPedestrians, 0)  // reduce matchedPoints features to a sum of its pedestrian count values

    matchedPointsPerHour[hour] = matchedPoints
    pedestrianCountsPerHour[hour] = currentPedCount
  }

  // calculate pedestrian density
  let pedestrianSum = (Object.values(pedestrianCountsPerHour).reduce((result: number, value: number) => {
    return result + value
  }, 0) as number)
  let pedestrianDensity = Math.round(pedestrianSum / turf.area(forRegion))

  console.log("pedestrianDensity in people / m²", pedestrianDensity)

  /*
   * calculate the Shannon Index as temporal entropy
   * Assumes hours of the day = species
   */
  let temporalEntropy = -1 * (Object.values(pedestrianCountsPerHour).reduce((result: number, value: number) => {
    return calculateShannonSummand(result, value, pedestrianSum)
  }, 0) as number)
  const hMax = Math.log(24) // compute Hmax = ln(numberOfSpecies) , Assumes hours of the day = species
  let temporalEntropyPercent = Math.round((temporalEntropy / hMax) * 100)

  console.log("temporalEntropyPercent", temporalEntropyPercent)
  console.log("temporalEntropy", temporalEntropy)
  console.log("Hmax", hMax)

 /*
  * calculate opportunities of interaction
  * The number of times that multiple agents are in the same place at the same time
 */
  let opportunitiesOfInteraction = 0
  for (const [hour, points] of Object.entries(matchedPointsPerHour)) {
    turf.featureEach(points, function (point, pointIdx) {
      let opportunitiesOfInteractionAtPoint = countPotentialMeetingsAtPoint(point, hour)
      opportunitiesOfInteraction += opportunitiesOfInteractionAtPoint
    })
  }
  opportunitiesOfInteraction = Math.round(opportunitiesOfInteraction / turf.area(forRegion))
  console.log("total opportunities of interaction in area", opportunitiesOfInteraction)


  /*
   * Calculate trips averages (average duration and length)
   */
  let averages = calculateTripAverages(forRegion)

  let results = {
    "orginal" : {
    "pedestrianDensity": pedestrianDensity.toString() + ' Pedestrians/m²',
    "temporalEntropyPercent": temporalEntropyPercent.toString() + '%',
    "opportunitiesOfInteraction": opportunitiesOfInteraction,
    "averageDuration": averages["duration"].toString() + ' minutes',
    "averageLength": averages["length"].toString() + ' meters'
    },
    "scaledResults": {
      "Pedestrian Density": Math.min((pedestrianDensity / 0.3) * 100, 100), // 0.3 as max. reachable value for ped. density
      "Temporal Entropy": temporalEntropyPercent,  // already in percent no need for scaling
      "Opportunities for Interaction": Math.min(opportunitiesOfInteraction * 1000, 100), // 20000 max. reachable value
      "Trip Duration": Math.min((averages["duration"] / 60) * 100, 100),
      "Trip Length": Math.min((averages["length"] / 1500) * 100, 100)
    }
  }

  return results
}


/**
 *  creates a featureCollection with all points in a timePath value set
 * @param currentTimePaths
 */
function createPathPointCollection(currentTimePaths) {
  // create an array of Point objects from all points in the current hour of timePaths
  let pathPoints = Object.keys(currentTimePaths["values"]).map(coordinateString => {
    let coords = coordinateString.split(',').map(x => {
      return parseFloat(x)
    })

    return turf.point(coords, {
      "pedestrianCount": currentTimePaths["values"][coordinateString].length,
      "busyAgents": currentTimePaths["values"][coordinateString]
    })
  })

  return turf.featureCollection(pathPoints)
}

function getSumOfPedestrians(total, point) {
  // initial value is 0
  if (point === 0) {
    return total + point;
  }
  // get pedestrian count of point and add it
  return total + point["properties"]["pedestrianCount"];
}


/**
 * find out how often 2 agents are at the same point at the same time.
 * only count them if time diff <= 5min
 * @param point
 * @param currentHour
 */
function countPotentialMeetingsAtPoint(point: turf.Feature, currentHour) {
  if (point.properties["busyAgents"].length === 1) {
    return 0 // min. 2 people at point per meeting
  }

  // find all agents that are the point
  let agentsAtPoint = {}
  for (const agentName of point.properties["busyAgents"]) {
    agentsAtPoint[agentName] = {"time": null}
    agentsAtPoint[agentName]["time"] = getTimeAgentIsAtPoint(agentName, currentHour, point.geometry.coordinates)
  }

  // iterate over the agents at the same point and extract pairs of agents within similar timeframes
  let meetingsAtPoint = []
  for (const agentName of Object.keys(agentsAtPoint)) {
    // number of potential agents met by our agent
    // every agent that was at the same point within a timeframe of 5min
    for (const [currentName, currentValues] of Object.entries(agentsAtPoint)) {
      if (currentName !== agentName) {
        let timeDiff = Math.abs(currentValues["time"] - agentsAtPoint[agentName]["time"])
        if (timeDiff <= 5 * 60) {   // 5 minutes
          // example meeting = ["agent_1", "agent_2"]
          let meeting = [agentName, currentName].sort()
          meetingsAtPoint.push(meeting)
        }
      }
    }
  }

  // remove duplicates meetings
  meetingsAtPoint = Array.from(new Set(meetingsAtPoint.map(JSON.stringify)), JSON.parse)
  return meetingsAtPoint.length
}


/**
 * get the timestamp at which the agent is at the point
 *
 * @param agentName
 * @param relevantHour
 * @param pointCoords
 */
function getTimeAgentIsAtPoint(agentName, relevantHour, pointCoords) {
  let activeAbmSet = store.state.scenario.activeAbmSet
  let agentIdx = store.state.scenario.agentIndexes[agentName]
  let agentData = activeAbmSet[agentIdx]

  // the agent might be at the point at multiple times. get the array indexes of those path points.
  let pathIndexes = []
  agentData.path.forEach((pathCoords, index) => {
    if (parseFloat(pathCoords[0]) == pointCoords[0] && parseFloat(pathCoords[1]) == pointCoords[1]) {
      // the agent could be at this point at multiple times
      pathIndexes.push(index)
    }
  })

  if (pathIndexes.length === 1) {
    // agent was at point only once. return this timestamp
    return agentData.timestamps[pathIndexes[0]]
  }

  // else: find the timeStamps at which the agent was at the point and match it with the relevant hour
  for (const idx of pathIndexes) {
    let timeStamp = agentData.timestamps[idx]
    const timeStampHour = Math.floor(timeStamp / (60*60)) + 8  // TODO move to central function to avoid magic numbers!!!

    // return the relevant time stamp
    if (timeStampHour === parseInt(relevantHour)) {
      return timeStamp
    }
  }
}

/*
 * calculates a summand of the Shannon formula.
 */
function calculateShannonSummand(currentSum: number, currentIndividualCount: number, totalIndividualsCount: number) {
  let p = currentIndividualCount / totalIndividualsCount
  return currentSum + (p * Math.log(p))   // Math.log(x) == ln(x)
}

/**
 * Calculates average duration and length of the trips in the region
 *
 * Iterates over all abmTrips and filters those with origin or destination with region
 * Computes averages on filter set
 *
 * @param forRegion
 *
 * @returns {"duration": number, "length": number}
 */
function calculateTripAverages(forRegion  = grasbrookRegion) {
  // array of all trips [{"agent", "origin", "destination", "length", "duration", "pathIndexes" }]
  let allTrips = store.state.scenario.abmTrips

  // filter all trips who's origin or destination are in the region
  let tripsInRegion = allTrips.filter(trip => {
    return turf.pointsWithinPolygon(turf.points([trip.origin, trip.destination]), forRegion).features.length
  })

  let averageDurationSec = tripsInRegion.reduce((acc, trip) => acc + trip["duration"], 0) / tripsInRegion.length
  let averageLengthMeters = tripsInRegion.reduce((acc, trip) => acc + trip["length"], 0) / tripsInRegion.length

  let averageDuration = averageDurationSec / 60

  return {"duration": Math.round(averageDuration), "length": Math.round(averageLengthMeters)}
}

