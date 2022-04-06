import * as turf from "@turf/turf";
import store from "@/store";
import GrasbrookGeoJson from "@/assets/grasbrookArea.json";

export async function calcAbmStatsForMultiLayer() {
  const multiLayerStats = store.getters["abm/abmResultStatsMultiLayer"] || {};

  const focusAreaIds = store.state.focusAreasGeoJson["features"].map((feat) => {
    return feat.id;
  });

  for (const focusAreaId of focusAreaIds) {
    if (!store.getters["abm/abmResultStatsMultiLayer"].focusAreaId) {
      multiLayerStats[focusAreaId] = {};
      const focusArea = getFocusAreaAsTurfObject(focusAreaId);
      const hourlyActivity = hourlyAgentActivityForRegion(focusArea);
      const pedestrianCountsPerHour = hourlyActivity["agentCounts"];

      // calculate pedestrian density
      const pedestrianSum = calculatePedestrianSumPerDay(
        pedestrianCountsPerHour
      );
      multiLayerStats[focusAreaId]["pedestrianDensity"] =
        calculatePedestrianDensity(pedestrianSum, focusArea);
    }
  }

  store.commit("abm/mutateAbmStatsMultiLayer", multiLayerStats);
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

/**
 * Calculates AbmStats for a focusArea and commits them to store
 * If no focusAreaId provided, stats are calculated for entire Grasbrook.
 *
 * Depends on abmResults in store (Differ depending on user input)
 *
 * @param focusAreaId
 */
export async function calculateAbmStatsForFocusArea(focusAreaId?: number) {
  if (!store.state.scenario.activeAbmSet) {
    console.log("cannot calc abmStats without abmData. No abmData in store.");
  }

  const focusAreas = getFocusAreaAsTurfObject(focusAreaId);

  const hourlyActivity = hourlyAgentActivityForRegion(focusAreas);
  const results = calculatePedestrianIndices(focusAreas, hourlyActivity);

  const abmStats = store.getters["abm/abmResultStats"] || {};

  const id = focusAreaId || "grasbrook";
  abmStats[id] = results;
  abmStats["units"] = [
    "pedestrians/m²",
    "%",
    "interactions/m²",
    "minutes",
    "meters",
  ];

  store.commit("abm/mutateAbmStats", abmStats);
  console.log("commited abmStats to store");
  store.commit("scenario/updateAbmStatsChart", true);
}

function hourlyAgentActivityForRegion(forRegion) {
  const pedestrianCountsPerHour = {};
  const matchedPointsPerHour = {}; // collection of Points with active agents within the investigation region

  for (const [hour, currentTimePaths] of Object.entries(
    store.getters["abm/abmDataForHeatmap"]
  )) {
    // create featureCollection from pathPoints
    const pathPointCollection = createPathPointCollection(currentTimePaths);

    // find all pathPoints within the region
    const matchedPoints = turf.pointsWithinPolygon(
      pathPointCollection,
      forRegion
    );
    const currentPedCount = matchedPoints.features.reduce(
      getSumOfPedestrians,
      0
    ); // reduce matchedPoints features to a sum of its pedestrian count values

    matchedPointsPerHour[hour] = matchedPoints;
    pedestrianCountsPerHour[hour] = currentPedCount;
  }

  return {
    activePoints: matchedPointsPerHour,
    agentCounts: pedestrianCountsPerHour,
  };
}

function calculatePedestrianSumPerDay(pedestrianCountsPerHour) {
  return Object.values(pedestrianCountsPerHour).reduce(
    (result: number, value: number) => {
      return result + value;
    },
    0
  ) as number;
}

function calculatePedestrianDensity(pedestrianSum, forRegion) {
  return Math.round((pedestrianSum / turf.area(forRegion)) * 1000) / 1000;
}

/*
 * Filter timePaths for all path-points within the region
 * Compute stats based on pedestrian counts in region (hour for hour)
 */
function calculatePedestrianIndices(forRegion, hourlyActivity) {
  const matchedPointsPerHour = hourlyActivity["activePoints"];
  const pedestrianCountsPerHour = hourlyActivity["agentCounts"];

  // calculate pedestrian density
  const pedestrianSum = calculatePedestrianSumPerDay(pedestrianCountsPerHour);
  const pedestrianDensity = calculatePedestrianDensity(
    pedestrianSum,
    forRegion
  );

  /*
   * calculate the Shannon Index as temporal entropy
   * Assumes hours of the day = species
   */
  const temporalEntropy =
    -1 *
    (Object.values(pedestrianCountsPerHour).reduce(
      (result: number, value: number) => {
        return calculateShannonSummand(result, value, pedestrianSum);
      },
      0
    ) as number);
  const hMax = Math.log(24); // compute Hmax = ln(numberOfSpecies) , Assumes hours of the day = species
  const temporalEntropyPercent = Math.round((temporalEntropy / hMax) * 100);

  console.log("temporalEntropyPercent", temporalEntropyPercent);
  console.log("temporalEntropy", temporalEntropy);
  console.log("Hmax", hMax);

  /*
   * calculate opportunities of interaction
   * The number of times that multiple agents are in the same place at the same time
   */

  // TODO agent paths at hour, intersections? -> in area? or min-distance?
  // oder wir createn artificial way points in area? mit timetamps??

  let opportunitiesOfInteraction = 0;
  for (const [hour, points] of Object.entries(matchedPointsPerHour)) {
    turf.featureEach(
      points as turf.FeatureCollection<turf.Point>,
      function (point) {
        const opportunitiesOfInteractionAtPoint = countPotentialMeetingsAtPoint(
          point,
          hour
        );
        opportunitiesOfInteraction += opportunitiesOfInteractionAtPoint;
      }
    );
  }
  opportunitiesOfInteraction =
    Math.round((opportunitiesOfInteraction / turf.area(forRegion)) * 1000) /
    1000;
  console.log(
    "total opportunities of interaction in area",
    opportunitiesOfInteraction
  );

  /*
   * Calculate trips averages (average duration and length)
   */
  const averages = calculateTripAverages(forRegion);

  return {
    original: {
      pedestrianDensity: pedestrianDensity,
      temporalEntropyPercent: temporalEntropyPercent,
      opportunitiesOfInteraction: opportunitiesOfInteraction,
      averageDuration: averages["duration"],
      averageLength: averages["length"],
    },
    scaledResults: {
      "Pedestrian Density": Math.min((pedestrianDensity / 0.3) * 100, 100), // 0.3 as max. reachable value for ped. density
      "Temporal Entropy": temporalEntropyPercent, // already in percent no need for scaling
      "Opportunities for Interaction": Math.min(
        (opportunitiesOfInteraction / 0.15) * 100,
        100
      ), // 0.3 interaction per m² max. reachable value
      "Trip Duration": Math.min((averages["duration"] / 60) * 100, 100),
      "Trip Length": Math.min((averages["length"] / 1500) * 100, 100),
    },
  };
}

/**
 *  creates a featureCollection with all points in a timePath value set
 * @param currentTimePaths
 */
function createPathPointCollection(currentTimePaths) {
  // create an array of Point objects from all points in the current hour of timePaths
  const pathPoints = Object.keys(currentTimePaths["values"]).map(
    (coordinateString) => {
      // keys of currentTimePaths["values"] are stringified coords like "10.1223,53.223"
      const coords = coordinateString.split(",").map((x) => {
        return parseFloat(x);
      });

      return turf.point(coords, {
        pedestrianCount: currentTimePaths["values"][coordinateString].length,
        busyAgents: currentTimePaths["values"][coordinateString],
      });
    }
  );

  return turf.featureCollection(pathPoints);
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
    return 0; // min. 2 people at point per meeting
  }

  const geom = point.geometry as turf.Geometry;
  // find all agents that are the point
  const agentsAtPoint = {};
  for (const agentName of point.properties["busyAgents"]) {
    agentsAtPoint[agentName] = { time: null };
    agentsAtPoint[agentName]["time"] = getTimeAgentIsAtPoint(
      agentName,
      currentHour,
      geom.coordinates
    );
  }

  // iterate over the agents at the same point and extract pairs of agents within similar timeframes
  let meetingsAtPoint: [string[]] = [] as unknown as [string[]];
  for (const agentName of Object.keys(agentsAtPoint)) {
    // number of potential agents met by our agent
    // every agent that was at the same point within a timeframe of 5min
    for (const [currentName, currentValues] of Object.entries(agentsAtPoint)) {
      if (currentName !== agentName) {
        const timeDiff = Math.abs(
          currentValues["time"] - agentsAtPoint[agentName]["time"]
        );
        if (timeDiff <= 5 * 60) {
          // 5 minutes
          // example meeting = ["agent_1", "agent_2"]
          const meeting = [agentName, currentName].sort();
          meetingsAtPoint.push(meeting);
        }
      }
    }
  }

  // remove duplicates meetings
  // @ts-ignore
  meetingsAtPoint = Array.from(
    new Set(meetingsAtPoint.map((meetings) => JSON.stringify(meetings))),
    JSON.parse
  );
  return meetingsAtPoint.length;
}

/**
 * get the timestamp at which the agent is at the point
 *
 * @param agentName
 * @param relevantHour
 * @param pointCoords
 */
function getTimeAgentIsAtPoint(agentName, relevantHour, pointCoords) {
  const activeAbmSet = store.state.scenario.activeAbmSet;
  const agentIdx = store.state.scenario.agentIndexes[agentName];
  const agentData = activeAbmSet[agentIdx];

  // the agent might be at the point at multiple times. get the array indexes of those path points.
  const pathIndexes = [];
  agentData.path.forEach((pathCoords, index) => {
    if (
      parseFloat(pathCoords[0]) == pointCoords[0] &&
      parseFloat(pathCoords[1]) == pointCoords[1]
    ) {
      // the agent could be at this point at multiple times
      pathIndexes.push(index);
    }
  });

  if (pathIndexes.length === 1) {
    // agent was at point only once. return this timestamp
    return agentData.timestamps[pathIndexes[0]];
  }

  // else: find the timeStamps at which the agent was at the point and match it with the relevant hour
  for (const idx of pathIndexes) {
    const timeStamp = agentData.timestamps[idx];
    const timeStampHour = Math.floor(timeStamp / (60 * 60)) + 8; // TODO move to central function to avoid magic numbers!!!

    // return the relevant time stamp
    if (timeStampHour === parseInt(relevantHour)) {
      return timeStamp;
    }
  }
}

/*
 * calculates a summand of the Shannon formula.
 */
function calculateShannonSummand(
  currentSum: number,
  currentIndividualCount: number,
  totalIndividualsCount: number
) {
  if (currentIndividualCount === 0) {
    return currentSum; // + 0
  }

  const p = currentIndividualCount / totalIndividualsCount;

  return currentSum + p * Math.log(p); // Math.log(x) == ln(x)
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
function calculateTripAverages(forRegion) {
  // array of all trips [{"agent", "origin", "destination", "length", "duration", "pathIndexes" }]
  const allTrips = store.getters["abm/abmTripsSummary"];

  // filter all trips who's origin or destination are in the region
  const tripsInRegion = allTrips.filter((trip) => {
    return turf.pointsWithinPolygon(
      turf.points([trip.origin, trip.destination]),
      forRegion
    ).features.length;
  });

  if (tripsInRegion.length === 0) {
    return { duration: 0, length: 0 };
  }

  const averageDurationSec =
    tripsInRegion.reduce((acc, trip) => acc + trip["duration"], 0) /
    tripsInRegion.length;
  const averageLengthMeters =
    tripsInRegion.reduce((acc, trip) => acc + trip["length"], 0) /
    tripsInRegion.length;

  const averageDuration = averageDurationSec / 60;

  return {
    duration: Math.round(averageDuration),
    length: Math.round(averageLengthMeters),
  };
}
//@ts-ignore
