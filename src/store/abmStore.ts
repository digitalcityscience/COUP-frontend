import type {
  AbmResponse,
  AbmScenarioConfiguration,
  AbmSimulationResult,
  AgentNameToIndexTable,
  AgentsClusteredForHeatmap,
  DataForAbmTimeGraph,
  AgentTrip,
  GeoJSON,
  AppContext,
  AbmTimeRange,
} from "@/models";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";


const defaultAbmScenarioConfigurations: Record<AppContext, AbmScenarioConfiguration> = {
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
  scenarioConfig = null;
  
  // original result data
  simulationResult: AbmSimulationResult | null = null;
  amenitiesGeoJSON: GeoJSON | null = null;
  
  // processed result data
  agentIndexesByName: AgentNameToIndexTable = {};
  tripsSummary: AgentTrip[] = [];
  dataForHeatmap: AgentsClusteredForHeatmap = {};
  dataForTimeGraph: DataForAbmTimeGraph | null = null;
  
  // UI
  animateLayer: boolean = false;
  timeSheetNeedsRerender: boolean = false;

  // entire abm simulations runs from 8am to 23(pm)
  timeRange: AbmTimeRange = [8,23];

  // abm stats for dashboard and multilayer
  // TODO: get this from backend and remove all stats handling!
  abmStats: any = {}
  amenityStats: any = {}
  abmStatsMultiLayer: any = {} 
  amenityStatsMultiLayer: any = {} 


  get scenarioConfiguration(): AbmScenarioConfiguration {
    return this.scenarioConfig || defaultAbmScenarioConfigurations[this.context.rootState.appContext];
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: AbmScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateSimulationResult(newResult: AbmSimulationResult): void {
    // @ts-ignore
    this.simulationResult = Object.freeze(newResult);
  }

  @Mutation
  mutateAmenitiesGeoJSON(newGeoJSON: GeoJSON): void {
    // @ts-ignore
    this.amenitiesGeoJSON = Object.freeze(newGeoJSON);
  }

  @Mutation
  mutateAgentIndexesByName(agentIndexes: AgentNameToIndexTable): void {
    // agent indexes only used for "getTimeAgentIsAtPoint" in abmStats
    this.agentIndexesByName = Object.freeze(agentIndexes);
  }

  @Mutation
  mutateTripsSummary(tripsSummary: AgentTrip[]): void {
    // only used in "calculateTripAverages" in abmStats
    // @ts-ignore
    this.tripsSummary = Object.freeze(tripsSummary);
  }

  @Mutation
  mutateDataForHeatmap(dataForHeatmap: AgentsClusteredForHeatmap): void {
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
  mutateAnimateLayer(animateLayer: boolean): void {
    this.animateLayer = animateLayer;
  }

  @Mutation
  mutateTimeRange(newTimeRange: AbmTimeRange): void {
    this.timeRange = newTimeRange;
  }
  
  @Mutation
  mutateTimeSheetNeedsRerender(needsRerendering: boolean): void {
    this.timeSheetNeedsRerender = needsRerendering;
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

  @Mutation
  resetResult(): void {
    this.simulationResult = null;

    // reset stats
    this.abmStats = {}
    this.amenityStats = {}
    this.abmStatsMultiLayer = {} 
    this.amenityStatsMultiLayer = {}
  }
  
  //@ts-ignore
  @MutationAction({ mutate: ["simulationResult", "amenitiesGeoJSON"] })
  async fetchResult(): Promise<AbmResponse> {
    const response: AbmResponse =
      await this.context.rootState.cityPyO.getAbmResultLayer(
        this.scenarioConfiguration,
      );

     return response
  }
}