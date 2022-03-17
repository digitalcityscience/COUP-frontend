import { AbmResponse, AbmSimulationResult, AgentsPerCoordinate, AgentIndexByName as AgentIndexTable, AgentTrip, MapboxMap, ResultDataSingleAgent, AgentsClusteredForHeatmap, AgentsClusteredForTimeGraph } from "@/models";
import GeoJSON from "@mapbox/geojson-types";

import LandscapeLayerConfig from "@/config/urbanDesignLayers/landscapeLayerConfig";

/* export function showBuildings(map: MapboxMap | null): void {
  showLayers(map, buildingLayerIds);
} */


/**
 * 
 * //Commit computed results to the store
    commit("agentIndexes", Object.freeze(agentIndexes));
    commit("abmTimePaths", Object.freeze(timePaths));
    commit("abmTrips", Object.freeze(trips));

    console.log("trips size: ", trips?.length);
    console.log("timePaths size: ", timePaths?.length);

    commit("abmSimpleTimes", Object.freeze(simpleTimeData));
    commit("activeAbmSet", Object.freeze(abmCore));
 * @param abmCore 
 */


/*
agent: {
        "agent_age": "18-35", 
        "id": "people_resident10", 
        "resident_or_visitor": "resident", 
        "source": "1.csv"
      }, 
paths: path": [
        [
          "10.012548264876571", 
          "53.53269844343127"
        ], 
        [
          "10.012922949769768", 
          "53.53256573458878"
        ], 
timestamps: "timestamps": [
        1260.0, 
        1320.0,  
trips": [
        {
          "destination": [
            10.027136865017347, 
            53.52698700774533
          ], 
          "duration": 1590.0, 
          "length": 1481, 
          "origin": [
            10.012548264876571, 
            53.53269844343127
          ], 
          "path_indexes": [
            0, 
            31
          ]
        }
*/


// TODO type result agentIndexes
// TODO type agent / who
// #0 create a simple lookup with all agent id's and their index in the abmCore
export function createLookUpTableAgentNameIndex(abmResultData: AbmSimulationResult): AgentIndexTable {
    const agentIndexes = {};
    
    abmResultData.forEach((agent: ResultDataSingleAgent, index: number) => {
        const agent_id = agent.agent.id;
        agentIndexes[agent_id] = index;
    });

    return agentIndexes;
}


    // #1 create a bin with data on trips each agent makes (origin, destination, pathIndexes, duration, length)
export function createTrips(abmResultData: AbmSimulationResult): AgentTrip[] {
    const trips = []
    
    abmResultData.forEach((who: ResultDataSingleAgent, _index: number) => {
        if (who.trips) {
            for (const trip of who.trips) {
            // trip has following information {"agent", "origin", "destination", "length", "duration", "pathIndexes" }
            trip["agent"] = who.agent.id;
            trips.push(trip);
            }
        }
    })

    return trips;
}


// timePaths
/*
    $store.state.scenario.abmTimePaths
    Array(24) [ <8 empty slots>, {…}, {…}, … ]
    ​
    8: Object { busyAgents: (143) […], values: {…}, stamps: 1926 }
    ​​
    busyAgents: Array(143) [ "people_resident10", "people_resident11", "people_resident12", … ]
    ​​​
    [0…99]
    ​​​
    [100…142]
    ​​​
    length: 143
    ​​​
    <prototype>: Array []
    ​​
    stamps: 1926
    ​​
    values: Object { "10.012548264876571,53.53269844343127": (1) […], "10.012922949769768,53.53256573458878": (1) […], "10.013288423065733,53.53242441624681": (1) […], … }
    ​​​
    "9.999691113437905,53.52568403176323": Array [ "people_visitor2" ]
    ​​​​
    0: "people_visitor2"
    ​​​​
    length: 1
    ​​​​
    <prototype>: Array []
 */

 /*
    abmSimpleTimes
    $store.state.scenario.abmSimpleTimes
    Object { 600: {…}, 900: {…}, 1200: {…}, 1500: {…}, 1800: {…}, 2100: {…}, 2400: {…}, 2700: {…}, 3000: {…}, 3300: {…}, … }
    ​
    600: Object { all: (16) […], undefined: (16) […], "36-60": (4) […], … }
    ​​
    "18-35": Array(10) [ "people_visitor1", "people_visitor1", "people_visitor1", … ]
    ​​​
    "36-60": Array(4) [ "people_resident3", "people_visitor5", "people_visitor5", … ]
    ​​
    "61-100": Array [ "people_visitor2", "people_visitor2" ]
    ​​
    all: Array(16) [ "people_resident3", "people_visitor1", "people_visitor1", … ]
    ​​
    resident: Array [ "people_resident3" ]
    ​​
    undefined: Array(16) [ "people_resident3", "people_visitor1", "people_visitor1", … ]
    ​​
    visitor: Array(15) [ "people_visitor1", "people_visitor1", "people_visitor1", … ]
 */


// #2 Clustering TIME DATA for Aggregation Layer
export function getAgentCountsPerHourAndCoordinate(
  abmResultData: AbmSimulationResult
  ): AgentsClusteredForHeatmap {
    const timePaths = []
    console.log("am i a worker?")
    console.log("abmResultdata passed to worker ", abmResultData)
    abmResultData.forEach((agent: ResultDataSingleAgent, _index: number) => {
      const agent_id = agent.agent.id;

      agent.timestamps.forEach((v, i, a) => {
        /*round timestamps to full hours*/
        const h = Math.floor(v / 3600) + 8;
        /*create object keys from full hours*/
        timePaths[h] = timePaths[h] || {};

        // add agent name to busy agents only once per agent
        if (i == 0) {
            timePaths[h].busyAgents = timePaths[h].busyAgents || [];
            timePaths[h].busyAgents.push(agent_id);
        }

        // TODO at least rename values to something understandable (busyAgentsPerCoordinate ?)
        timePaths[h].values = timePaths[h].values || {};
        const coords = agent.path[i].toString(); // coordinates stringified as object key
        timePaths[h].values[coords] = timePaths[h].values[coords] || [];
        
        // push agent name to the array of busy agents at this coord
        // TODO we just need the agent count per coord, not the agent names
        if (!timePaths[h].values[coords].includes(agent_id)) {
          timePaths[h].values[coords].push(agent_id);
        }
      })
    })
    return timePaths;
}


export function aggregateAbmResultsBy5minForTimeGraph(
  abmResultData: AbmSimulationResult
  ): AgentsClusteredForTimeGraph {
    const fiveMinData = {}
    console.log("inside timegraph data worker")
    console.log(abmResultData)
    abmResultData.forEach((who: ResultDataSingleAgent, _index: number) => {
        console.log("hello")
        const agent_id = who.agent.id;
        who.timestamps.forEach((timeStampInSec) => {
          const fiveMinStep = Math.floor(timeStampInSec / 300) * 300;
          // TODO only need count of agents during this 5min slot. 
          fiveMinData[fiveMinStep] = fiveMinData[fiveMinStep] || {};
          fiveMinData[fiveMinStep]["all"] = fiveMinData[fiveMinStep]["all"] || [];
          fiveMinData[fiveMinStep]["all"].push(agent_id);
        })
    })

    console.log("finsihed 5min agg")

    return fiveMinData;
}

