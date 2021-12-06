import { Module, VuexModule, Mutation, Action } from "vuex-module-decorators";

export type StormWaterRoofType = "extensive" | "intensive";

export type StormWaterFlowPath = "blockToPark" | "blockToStreet";

export interface StormWaterScenarioConfiguration {
  returnPeriod: number;
  flowPath: StormWaterFlowPath;
  roofs: StormWaterRoofType;
}

export interface StormwaterState {
  stormWaterScenarioConfiguration: StormWaterScenarioConfiguration;
}

export const defaultStormwaterConfiguration: StormWaterScenarioConfiguration = {
  returnPeriod: 2,
  flowPath: "blockToPark",
  roofs: "extensive",
};

@Module({ namespaced: true })
export default class StormWater extends VuexModule {
  config: StormwaterState = {
    stormWaterScenarioConfiguration: { ...defaultStormwaterConfiguration },
  };

  scenarioConfig: StormWaterScenarioConfiguration = {
    ...defaultStormwaterConfiguration,
  };

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  count = 0;

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }
}
