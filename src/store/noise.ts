import type {
  CalculationTask,
  SavedNoiseScenarioConfiguration,
  NoiseScenarioConfiguration,
  NoiseResult,
  GeoJSON,
} from "@/models";
import { cityPyOUserid } from "@/services/authn.service";
import * as calcModules from "@/services/calculationModules.service";
import type { Feature } from "@mapbox/geojson-types";
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
  traffic_quota: 1,
};

export const defaultNoiseScenarioConfigs: SavedNoiseScenarioConfiguration[] = [
  {
    max_speed: 30,
    traffic_quota: 0,
    label: "NO GRASBROOK TRAFFIC",
  },
  {
    max_speed: 30,
    traffic_quota: 1,
    label: "100% TRAFFIC | 30 km/h",
  },
  {
    max_speed: 50,
    traffic_quota: 1,
    label: "100% TRAFFIC | 50 km/h",
  },
];

/**
 * Applies the traffic percentage to the traffic count points geojson
 * @param trafficCountPointsGeoJSON GeoJSON
 * @param trafficQuota float
 */
export function applyTrafficQuota(
  trafficCountPointsGeoJSON: GeoJSON,
  trafficQuota: number
): GeoJSON {
  const pointFeaturesWithTrafficData =
    trafficCountPointsGeoJSON.features as Feature[];
  pointFeaturesWithTrafficData.forEach((point: Feature) => {
    point.properties["description"] =
      "Cars: " +
      Math.floor(
        point.properties["car_traffic_daily"] * trafficQuota
      ).toLocaleString() +
      " Trucks: " +
      Math.floor(
        point.properties["truck_traffic_daily"] * trafficQuota
      ).toLocaleString();
  });

  trafficCountPointsGeoJSON.features = pointFeaturesWithTrafficData;

  return trafficCountPointsGeoJSON;
}

@Module({ namespaced: true })
export default class NoiseStore extends VuexModule {
  scenarioConfig: NoiseScenarioConfiguration = {
    ...defaultNoiseConfiguration,
  };

  savedScenarioConfigs: SavedNoiseScenarioConfiguration[] =
    defaultNoiseScenarioConfigs;

  calcTask: CalculationTask | null = null;

  result: NoiseResult | null = null;

  trafficCountPoints: GeoJSON | null = null;

  errMsg = "";

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

  get trafficCountPointsGeoJSON(): GeoJSON {
    return this.trafficCountPoints;
  }

  // somehow we cannot directly check this on the component, as
  get hasNoiseResult(): boolean {
    return this.noiseResult !== null;
  }

  @Mutation
  mutateErrMsg(msg: string): void {
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
    this.savedScenarioConfigs.push({
      ...scenarioToSave,
      label:
        scenarioToSave.max_speed.toString() +
        "km/h" +
        " | " +
        (scenarioToSave.traffic_quota * 100).toString() +
        "%",
    });
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

  @MutationAction({ mutate: ["calcTask"] })
  async triggerCalculation(
    cityPyOUserid: string
  ): Promise<{ calcTask: CalculationTask }> {
    // request calculation and fetch results
    const task: CalculationTask = await calcModules.requestCalculationNoise(
      this.scenarioConfiguration,
      cityPyOUserid
    );
    return { calcTask: task };
  }

  @MutationAction({ mutate: ["result"], rawError: true })
  async fetchResult(): Promise<{ result: NoiseResult }> {
    const simulationResult: NoiseResult = await calcModules.getResultForNoise(
      this.calculationTask
    );

    return { result: simulationResult };
  }

  @MutationAction({ mutate: ["trafficCountPoints"], rawError: true })
  async fetchTrafficCountPointsGeoJSON(): Promise<{
    trafficCountPoints: GeoJSON;
  }> {
    const cityPyo = this.context.rootState.cityPyO;
    const trafficCountPoints: GeoJSON = await cityPyo.getLayer("trafficCounts");

    return { trafficCountPoints: trafficCountPoints };
  }
}
