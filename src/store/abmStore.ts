import type {
  // TODO Refactor
  AbmResponse,
  AbmScenarioConfiguration,
  AbmSimulationResult,
  AgentIndexByName,
  AgentsClusteredForHeatmap,
  AgentsClusteredForTimeGraph,
  AgentTrip,
  GeoJSON,
} from "@/models";
import { buildAggregationLayer, buildTripsLayer } from "@/services/deck.service";
import { addDeckLayerToMap } from "@/services/map.service";
import {
  Module,
  Mutation,
  MutationAction,
  Action,
  VuexModule,
} from "vuex-module-decorators";
import CityPyO from './cityPyO';
import * as resultProcessing from "@/services/abm/resultProcessing.service";

export const defaultAbmScenarioConfiguration: AbmScenarioConfiguration = {
  bridge_hafencity: true,
  underpass_veddel_north: true,
  roof_amenities: "complementary",
  blocks: "open",
  main_street_orientation: "horizontal"
};

@Module({ namespaced: true })
export default class AbmStore extends VuexModule {
  scenarioConfig: AbmScenarioConfiguration = {
    ...defaultAbmScenarioConfiguration,
  };
  result: AbmSimulationResult | null = null;
  amenitiesGeoJSON: GeoJSON;
  agentIndexes: AgentIndexByName = {};
  tripsSummary: AgentTrip[] = [];
  dataForHeatmap: AgentsClusteredForHeatmap = {};
  dataForTimeGraph: AgentsClusteredForTimeGraph = {};
  
  animateLayer = false;


  get scenarioConfiguration(): AbmScenarioConfiguration {
    return this.scenarioConfig;
  }

  get abmResult(): AbmSimulationResult {
    return this.result;
  } 
  
  get abmAgentIndexes(): AgentIndexByName {
    return this.agentIndexes;
  }
  get abmTripsSummary(): AgentTrip[] {
    return this.tripsSummary;
  }
  
  get abmDataForHeatmap(): AgentsClusteredForHeatmap {
    return this.abmDataForHeatmap;
  }
  
  get abmDataForTimeGraph(): AgentsClusteredForTimeGraph {
    return this.abmDataForTimeGraph;
  }

  get animateAbmTripsLayer(): boolean {
    return this.animateLayer;
  }

  get cityPyo(): CityPyO {
    return this.context.rootState.cityPyO;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: AbmScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateAnimateLayer(animateLayer: boolean): void {
    this.animateLayer = animateLayer;
  }

  @Mutation
  mutateResult(newResult: AbmSimulationResult): void {
    // @ts-ignore
    this.result =  Object.freeze(newResult);
  }

  @Mutation
  mutateResultForHeatmap(simulationResult: AbmSimulationResult): void {
    // used heatmap and for "createPathPointCollection" in abmStats
    // heatmap needs "coordinates" and count of active agents per coords 
    // in which the key is a stringified coordinate and the value is an array of agent names 
    // however, we only effectively would need the agent count.
    this.dataForHeatmap = Object.freeze(
      resultProcessing.getAgentCountsPerHourAndCoordinate(simulationResult)
    );
  }  

  @Mutation
  mutateResultForTimeGraph(simulationResult: AbmSimulationResult): void {
     // only used for timeGraph, only need "all" value
     this.dataForTimeGraph = Object.freeze(
      resultProcessing.aggregateAbmResultsBy5minForTimeGraph(simulationResult)
    );
  }
  
  @Mutation
  mutateAgentLookupTable(simulationResult: AbmSimulationResult): void {
    // agent indexes only used for "getTimeAgentIsAtPoint" in abmStats
    this.agentIndexes = Object.freeze(
      resultProcessing.createLookUpTableAgentNameIndex(simulationResult)
    );
  }  
  
  @Mutation
  mutateTripsSummary(simulationResult: AbmSimulationResult): void {
    // only used in "calculateTripAverages" in abmStats
    // @ts-ignore
    this.tripsSummary = Object.freeze(
      resultProcessing.createTrips(simulationResult)
    );
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateAbmResult(
    cityPyOUserid: string
  ): Promise<{ result: AbmResponse }> {
    const simulationResult: AbmResponse =
      await this.cityPyo.getAbmResultLayer(
        cityPyOUserid,
        this.scenarioConfiguration,
      );

      console.log("simulation resutl", simulationResult)
      debugger;

    return { result: simulationResult };
  }

  @Action({})
  // TODO refactor does it need to be current timestamp?? 
  updateAbmLayers([map, currentTimeStamp = 0]): void {
    const tripsLayer = buildTripsLayer(this.abmResult, currentTimeStamp);
    addDeckLayerToMap(tripsLayer, map);
    
    const heatMapLayer = buildAggregationLayer(this.dataForHeatmap);
    addDeckLayerToMap(heatMapLayer, map);
  }

}
