import type { StormWaterScenarioConfiguration, StormWaterResult, GeoJSON } from "@/models";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";
import store from "@/store";


export interface StormwaterState {
  stormWaterScenarioConfiguration: StormWaterScenarioConfiguration;
  stormWaterResult: StormWaterResult | null;
}

export const defaultStormwaterConfiguration: StormWaterScenarioConfiguration = {
  returnPeriod: 2,
  flowPath: "blockToPark",
  roofs: "extensive",
};

@Module({ namespaced: true })
export default class StormWaterStore extends VuexModule {
  scenarioConfig: StormWaterScenarioConfiguration = {
    ...defaultStormwaterConfiguration,
  };
  result: StormWaterResult|null = null;

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  get stormWaterResult(): StormWaterResult {
    return this.result
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateResult(
    newResult: StormWaterResult
  ): void {
    this.result = {
      geojson: Object.freeze(newResult.geojson),
      rainData: newResult.rainData,
      complete: newResult.complete
    };
  }
  
  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateStormWaterResult(): Promise<{ result: StormWaterResult }> {

    // request calculation and fetch results
    const calcModules = this.context.rootState.calculationModules;
    const stormWaterResultUuid = await calcModules.requestCalculationStormWater(this.scenarioConfiguration);
    const simulationResult: StormWaterResult = await calcModules.getResultForStormWater(stormWaterResultUuid);

    return ( { result:  simulationResult } );
  }
}
