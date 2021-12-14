import type {
  StormWaterResult,
  StormWaterScenarioConfiguration,
} from "@/models";
import { cityPyOUserid } from "@/services/authn.service";
import * as calcModules from "@/services/calculationModules.service";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";

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
  result: StormWaterResult | null = null;

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  get stormWaterResult(): StormWaterResult {
    return this.result;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateResult(newResult: StormWaterResult): void {
    this.result = {
      geojson: Object.freeze(newResult.geojson),
      rainData: newResult.rainData,
      complete: newResult.complete,
    };
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateStormWaterResult(): Promise<{ result: StormWaterResult }> {
    // request calculation and fetch results
    const stormWaterResultUuid = await calcModules.requestCalculationStormWater(
      this.scenarioConfiguration,
      cityPyOUserid()
    );
    const simulationResult: StormWaterResult =
      await calcModules.getResultForStormWater(stormWaterResultUuid);

    return { result: simulationResult };
  }
}
