import type {
  CalculationTask,
  SavedWindScenarioConfiguration,
  WindScenarioConfiguration,
  WindResult
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
  wind_direction: 270,
  wind_speed: 5
};

export const defaultWindScenarioConfigs: SavedWindScenarioConfiguration[] = [
  {
    wind_speed: 5,
    wind_direction: 270,
    label: "ANNUAL AVERAGE",
  },
  {
    wind_speed: 25,
    wind_direction: 270,
    label: "LIGHT BREEZE",
  },
  {
    wind_speed: 45,
    wind_direction: 270,
    label: "STRONG BREEZE",
  }
];


@Module({ namespaced: true })
export default class WindStore extends VuexModule {
  scenarioConfig: WindScenarioConfiguration = {
    ...defaultWindConfiguration,
  };
  
  savedScenarioConfigs: SavedWindScenarioConfiguration[] = defaultWindScenarioConfigs;

  calcTask: CalculationTask | null = null;
  
  result: WindResult | null = null;

  errMsg: string = "";

  get scenarioConfiguration(): WindScenarioConfiguration {
    return this.scenarioConfig;
  }

  get savedScenarioConfigurations(): SavedWindScenarioConfiguration[] {
    return this.savedScenarioConfigs;
  }

  get calculationTask(): CalculationTask {
    return this.calcTask;
  }
  
  get windResult(): WindResult {
    return this.result;
  }

  // somehow we cannot directly check this on the component, as 
  get hasWindResult(): boolean {
    return this.windResult !== null;
  }

  @Mutation
  mutateErrMsg(
    msg: string
  ): void {
    this.errMsg = msg;
  }
  
  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: WindScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  addSavedScenarioConfiguration(
    scenarioToSave: WindScenarioConfiguration
  ): void {
    this.savedScenarioConfigs.push(
      {
       ... scenarioToSave,
       label: scenarioToSave.wind_speed.toString() + "km/h" + " | " + scenarioToSave.wind_direction.toString() + "°"  
      }  
      );
  }

  @Mutation
  mutateResult(newResult: WindResult): void {
    this.result = {
      geojson: Object.freeze(newResult.geojson),
    };
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  // TODO why is this working without a specified @Mutation method?? 
  @MutationAction({ mutate: ["calcTask"] })
  async triggerCalculation(): Promise<{ calcTask: CalculationTask }> {
    // request calculation and fetch results
    const task: CalculationTask = 
      await calcModules.requestCalculationWind(
        this.scenarioConfiguration,
        cityPyOUserid()
    );
    return { calcTask: task };
  }
    
  @MutationAction({ mutate: ["result"] , rawError: true })
  async fetchResult(): Promise<{ result: WindResult }> {
    const simulationResult: WindResult = await calcModules.getResultForWind(this.calculationTask);

    return { result: simulationResult };
  }
}
