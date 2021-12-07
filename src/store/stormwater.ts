import type { StormWaterScenarioConfiguration, StormWaterResult } from "@/models";
import { Module, VuexModule, Mutation } from "vuex-module-decorators";

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
  }@Mutation
  resetResult(): void {
    this.result = null;
  }
}
