import { AbmSimulationResult, AgentIndexByName as AgentIndexTable, AgentTrip, ResultDataSingleAgent, AgentsClusteredForHeatmap, DataForAbmTimeGraph } from "@/models";


// create a simple lookup with all agent id's and their index in the abmCore
// TODO refactor USE THIS!
export function createLookUpTableAgentNameIndex(abmResultData: AbmSimulationResult): AgentIndexTable {
    const agentIndexes = {};
    
    abmResultData.forEach((agent: ResultDataSingleAgent, index: number) => {
        const agent_id = agent.agent.id;
        agentIndexes[agent_id] = index;
    });

    return agentIndexes;
}


    // #1 create a bin with data on trips each agent makes (origin, destination, pathIndexes, duration, length)
    // TODO refactor use this
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


// Clustering TIME DATA for Aggregation Layer
export function getAgentCountsPerHourAndCoordinate(
  abmResultData: AbmSimulationResult
  ): AgentsClusteredForHeatmap {
    const timePaths = []
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

/** aggregating all active agents in chunks of five minutes time slots  */
export function aggregateAbmResultsBy5minForTimeGraph(
  abmResultData: AbmSimulationResult
  ): DataForAbmTimeGraph {
    // checks whether an array of timestamps has a value within the 5 minutes intervall 
    function anyTimeStampInFiveMinIntervall(
      timestamps: number[],
      intervallStart: number
      ) {
      return timestamps.some(timestamp => {
        return (
          timestamp >= intervallStart
          && timestamp < (intervallStart + 300)
        )
      })
    }

    // init 5 minute summaries, by creating keys for each new 300 seconds
    const simMaxTimeStamp = 57600;  // TODO magic number for max simulation time.
    const timeSheetData = {};
    for (let step = 0; step <= Math.ceil(simMaxTimeStamp / 300); step++) {
      timeSheetData[step * 300] = 0;
    }

    // iterate over each agent in abmResultData and count, if active during 5 min time intervall
    abmResultData.forEach((who: ResultDataSingleAgent, _index: number) => {
      Object.keys(timeSheetData).forEach(fiveMinStep => {
        if (anyTimeStampInFiveMinIntervall(who.timestamps, Number(fiveMinStep))) {
          timeSheetData[fiveMinStep] += 1;
        }
      })
    })

    // format data for timechart use
    const dataLabels = [];
    const dataValues = [];

    Object.keys(timeSheetData).forEach(fiveMinStep => {
      // labels are hourly strings
      let label = Math.floor(Number(fiveMinStep) / 3600) + 8 + ":00";
      let activeAgentsCount = timeSheetData[fiveMinStep];

      dataLabels.push(label);
      dataValues.push(activeAgentsCount);
    });
    
    return {labels: dataLabels, values: dataValues};
}


