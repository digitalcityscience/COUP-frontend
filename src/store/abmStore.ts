import type {
  // TODO Refactor
  AbmResponse,
  AbmScenarioConfiguration,
  AbmSimulationResult,
  AgentNameToIndexTable,
  AgentsClusteredForHeatmap,
  DataForAbmTimeGraph,
  AgentTrip,
  GeoJSON,
  AppContext,
} from "@/models";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";
import CityPyO from './cityPyO';


export const defaultAbmScenarioConfigurations: Record<AppContext, AbmScenarioConfiguration> = {
  "grasbrook": {
    bridge_hafencity: true,
    underpass_veddel_north: true,
    roof_amenities: "complementary",
    blocks: "open",
    main_street_orientation: "horizontal"
  }, 
  "schb": {
    "amenity_config": "future"
  }
};

@Module({ namespaced: true })
export default class AbmStore extends VuexModule {
  _scenarioConfig = null;
  
  // original result data
  simulationResult: AbmSimulationResult | null = null;
  amenitiesGeoJSON: GeoJSON | null = null;
  
  // processed result data
  agentIndexes: AgentNameToIndexTable = {};
  tripsSummary: AgentTrip[] = [];
  dataForHeatmap: AgentsClusteredForHeatmap = {};
  dataForTimeGraph: DataForAbmTimeGraph | null = null;
  
  // abm stats for dashboard and multilayer
  abmStats: any = {}
  amenityStats: any = {}
  abmStatsMultiLayer: any = {} 
  amenityStatsMultiLayer: any = {} 
  
  // UI
  animateLayer: boolean = false;
  reRenderTimeSheet: boolean = false;


  get scenarioConfig(): AbmScenarioConfiguration {
    return this._scenarioConfig || defaultAbmScenarioConfigurations[this.context.rootState.appContext];
  }

  set scenarioConfig(newConfig: AbmScenarioConfiguration) {
    this._scenarioConfig = newConfig;
  }

  // TODO delete and rename get scnearioConfig in get scenearioConfiguration
  get scenarioConfiguration(): AbmScenarioConfiguration {
    return this.scenarioConfig;
  }

  get abmResult(): AbmSimulationResult {
    return this.simulationResult;
  } 

  get abmAmenitiesGeoJSON(): GeoJSON {    
    return this.amenitiesGeoJSON;
  }
  
  get abmTripsSummary(): AgentTrip[] {
    return this.tripsSummary;
  }
  
  get abmDataForHeatmap(): AgentsClusteredForHeatmap {
    return this.dataForHeatmap;
  }
  
  get abmDataForTimeGraph(): DataForAbmTimeGraph {
    return this.dataForTimeGraph;
  }

  get abmAgentIndexes(): AgentNameToIndexTable {
    return this.agentIndexes;
  }
  get abmResultStats(): any {
    return this.abmStats;
  }
  get amenityConfigStats(): any {
    return this.amenityStats;
  }
  get abmResultStatsMultiLayer(): any {
    return this.abmStatsMultiLayer;
  }
  get amenityConfigStatsMultiLayer(): any {
    return this.amenityStatsMultiLayer;
  }

  get animateAbmTripsLayer(): boolean {
    return this.animateLayer;
  } 
  
  get reRenderAbmTimeSheet(): boolean {
    return this.reRenderTimeSheet;
  }

  get cityPyo(): CityPyO {
    return this.context.rootState.cityPyO;
  }


  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: AbmScenarioConfiguration
  ): void {
    this._scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateAnimateLayer(animateLayer: boolean): void {
    this.animateLayer = animateLayer;
  }
  
  @Mutation
  mutateReRenderTimeSheet(needsReRendering: boolean): void {
    this.reRenderTimeSheet = needsReRendering;
  }

  @Mutation
  mutateResult(newResult: AbmSimulationResult): void {
    // @ts-ignore
    this.simulationResult = Object.freeze(newResult);
  }

  @Mutation
  mutateAmenitiesGeoJSON(newGeoJSON: GeoJSON): void {
    // @ts-ignore
    this.amenitiesGeoJSON = Object.freeze(newGeoJSON);
  }

  @Mutation
  mutateResultForHeatmap(dataForHeatmap: AgentsClusteredForHeatmap): void {
    // used heatmap and for "createPathPointCollection" in abmStats
    // heatmap needs "coordinates" and count of active agents per coords 
    // in which the key is a stringified coordinate and the value is an array of agent names 
    // TODO however, we only effectively would need the agent count, instead of agent names.
    this.dataForHeatmap = Object.freeze(dataForHeatmap);
  }  

  @Mutation
  mutateDataForTimeGraph(dataForTimeGraph: DataForAbmTimeGraph): void {
     // only used for timeGraph, only need "all" value
     this.dataForTimeGraph = Object.freeze(dataForTimeGraph);
  }
  
  @Mutation
  mutateAgentLookupTable(agentIndexes: AgentNameToIndexTable): void {
    // agent indexes only used for "getTimeAgentIsAtPoint" in abmStats
    this.agentIndexes = Object.freeze(agentIndexes);
  }  
  
  @Mutation
  mutateTripsSummary(tripsSummary: AgentTrip[]): void {
    // only used in "calculateTripAverages" in abmStats
    // @ts-ignore
    this.tripsSummary = Object.freeze(tripsSummary);
  }

  @Mutation
  resetResult(): void {
    this.simulationResult = null;

    // reset stats
    this.abmStats = {}
    this.amenityStats = {}
    this.abmStatsMultiLayer = {} 
    this.amenityStatsMultiLayer = {}
  }

  @Mutation
  mutateAbmStats(abmStats: any): void {
    this.abmStats = abmStats;
  }
  @Mutation
  mutateAmenityStats(amenityStats: any): void {
    this.amenityStats = amenityStats;
  }
  @Mutation
  mutateAbmStatsMultiLayer(abmStatsML: any): void {
    this.abmStatsMultiLayer = abmStatsML;
  }
  @Mutation
  mutateAmenityStatsMultiLayer(amenityStatsML: any): void {
    this.amenityStatsMultiLayer = amenityStatsML;
  }
  

  //@ts-ignore
  @MutationAction({ mutate: ["simulationResult", "amenitiesGeoJSON"] })
  async fetchResult(): Promise<AbmResponse> {
    const response: AbmResponse =
      await this.cityPyo.getAbmResultLayer(
        this.scenarioConfiguration,
      );

     return response
  }

  /* @Action({})
  // TODO refactor does it need to be current timestamp?? 
  updateAbmLayers([map, currentTimeStamp = 0]): void {
    const tripsLayer = buildTripsLayer(this.abmResult, currentTimeStamp);
    addDeckLayerToMap(tripsLayer, map);
    
    const heatMapLayer = buildAggregationLayer(this.dataForHeatmap);
    addDeckLayerToMap(heatMapLayer, map);
  } */

}
