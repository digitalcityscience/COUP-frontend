import type {
  StormWaterResult,
  StormWaterScenarioConfiguration,
  MapboxMap,
} from "@/models";
import * as calcModules from "@/services/calculationModules.service";
import { buildSWLayer } from "@/services/deck.service";
import { addDeckLayerToMap } from "@/services/map.service";
import {
  Module,
  Mutation,
  MutationAction,
  Action,
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
  animateLayer = false;

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  get stormWaterResult(): StormWaterResult {
    return this.result;
  }

  get animateStormWaterLayer(): boolean {
    return this.animateLayer;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateAnimateLayer(animateLayer: boolean): void {
    this.animateLayer = animateLayer;
  }

  @Mutation
  mutateResult(newResult: StormWaterResult): void {
    this.result = {
      geojson: Object.freeze(newResult.geojson),
      rainData: newResult.rainData,
    };
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateStormWaterResult(
    cityPyOUserid: string
  ): Promise<{ result: StormWaterResult }> {
    // request calculation and fetch results
    const stormWaterResultUuid = await calcModules.requestCalculationStormWater(
      this.scenarioConfiguration,
      cityPyOUserid
    );
    const simulationResult: StormWaterResult =
      await calcModules.getResultForStormWater(stormWaterResultUuid);

    return { result: simulationResult };
  }

  @Action({})
  updateStormWaterLayer([map, rainTime = 0]: [MapboxMap, number]): void {
    // update the time-dependend stormwater deck.gl layer, to rainTime
    const deckLayer = buildSWLayer(this.stormWaterResult.geojson, rainTime);
    addDeckLayerToMap(deckLayer, map);
  }
}
