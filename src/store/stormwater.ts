import type { StormWaterScenarioConfiguration } from "@/models";
import { Module, VuexModule, Mutation } from "vuex-module-decorators";

export interface StormwaterState {
  stormWaterScenarioConfiguration: StormWaterScenarioConfiguration;
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

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }
}
