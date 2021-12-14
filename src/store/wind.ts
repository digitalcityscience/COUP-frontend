import type {
  WindResult,
  WindScenarioConfiguration,
} from "@/models";
import { cityPyOUserid } from "@/services/authn.service";
import * as calcModules from "@/services/calculationModules.service";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";

export const defaultWindConfiguration: WindScenarioConfiguration = {
  windDirection: 270,
  windSpeed: 5
};


// TODO make an interface CalculationModuleStore which extends VuexModule ;
//  Wind/Stormwater are then to extend CalculationModuleStore;
@Module({ namespaced: true })
export default class WindStore extends VuexModule {
  scenarioConfig: WindScenarioConfiguration = {
    ...defaultWindConfiguration,
  };
  result: WindResult | null = null;

  get scenarioConfiguration(): WindScenarioConfiguration {
    return this.scenarioConfig;
  }

  get windResult(): WindResult {
    return this.result;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: WindScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateResult(newResult: WindResult): void {
    this.result = {
      geojson: Object.freeze(newResult.geojson),
      complete: newResult.complete,
    };
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateWindResult(): Promise<{ result: WindResult }> {
    // request calculation and fetch results
    const windResultUuid = await calcModules.requestCalculationWind(
      this.scenarioConfiguration,
      cityPyOUserid()
    );

    // TODO ignore for now, refactor wind update to use this function analog to stormwater
    // @ts-ignore
    const simulationResult: WindResult =
      await calcModules.getResultForWind(windResultUuid);

    return { result: simulationResult };
  }
}
