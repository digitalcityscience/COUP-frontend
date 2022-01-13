import type {
  CalculationTask,
  SavedNoiseScenarioConfiguration,
  NoiseScenarioConfiguration,
  NoiseResult
} from "@/models";
import { cityPyOUserid } from "@/services/authn.service";
import * as calcModules from "@/services/calculationModules.service";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";

export const noiseSettingsNames = {
  max_speed: "max_speed",
  traffic_quota: "traffic_quota",
};

export const defaultNoiseConfiguration: NoiseScenarioConfiguration = {
  max_speed: 50,
  traffic_percentage: 100
};

export const defaultNoiseScenarioConfigs: SavedNoiseScenarioConfiguration[] = [
  {
    max_speed: 50,
    traffic_percentage: 100,
    label: "PLANNED TRAFFIC",
  },
  {
    max_speed: 30,
    traffic_percentage: 100,
    label: "PLANNED TRAFFIC, 30 km/h",
  },
  {
    max_speed: 30,
    traffic_percentage: 0,
    label: "NO TRAFFIC",
  }
];


/**
 * Applies the traffic percentage to the original traffic counts
 * @param trafficCountsOriginalPlanning GeoJson Features
 * @param trafficPercent float
 */
export function getFormattedTrafficCounts(
  trafficCountsOriginalPlanning,
  trafficPercent
) {
  const formattedTrafficCounts = trafficCountsOriginalPlanning;
  formattedTrafficCounts.forEach((point) => {
    point["properties"]["car_traffic_daily"] =
      point["properties"]["car_traffic_daily"] * trafficPercent;
    point["properties"]["truck_traffic_daily"] =
      point["properties"]["truck_traffic_daily"] * trafficPercent;
  });

  return formattedTrafficCounts;
}


@Module({ namespaced: true })
export default class NoiseStore extends VuexModule {
  scenarioConfig: NoiseScenarioConfiguration = {
    ...defaultNoiseConfiguration,
  };
  
  savedScenarioConfigs: SavedNoiseScenarioConfiguration[] = defaultNoiseScenarioConfigs;

  calcTask: CalculationTask | null = null;
  
  result: NoiseResult | null = null;

  errMsg: string = "";

  get scenarioConfiguration(): NoiseScenarioConfiguration {
    return this.scenarioConfig;
  }

  get savedScenarioConfigurations(): SavedNoiseScenarioConfiguration[] {
    return this.savedScenarioConfigs;
  }

  get calculationTask(): CalculationTask {
    return this.calcTask;
  }
  
  get noiseResult(): NoiseResult {
    return this.result;
  }

  // somehow we cannot directly check this on the component, as 
  get hasNoiseResult(): boolean {
    return this.noiseResult !== null;
  }

  @Mutation
  mutateErrMsg(
    msg: string
  ): void {
    this.errMsg = msg;
  }
  
  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: NoiseScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  addSavedScenarioConfiguration(
    scenarioToSave: NoiseScenarioConfiguration
  ): void {
    this.savedScenarioConfigs.push(
      {
       ... scenarioToSave,
       label: scenarioToSave.max_speed.toString() + "km/h" + " | " + scenarioToSave.traffic_percentage.toString() + "%"  
      }  
      );
  }

  @Mutation
  mutateResult(newResult: NoiseResult): void {
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
  async fetchResult(): Promise<{ result: NoiseResult }> {
    const simulationResult: NoiseResult = await calcModules.getResultForWind(this.calculationTask);

    return { result: simulationResult };
  }
}
