import type {
  // TODO Refactor
  AbmResult,
  AbmScenarioConfiguration,
} from "@/models";
import { buildAggregationLayer, buildTripsLayer } from "@/services/deck.service";
import { addDeckLayerToMap } from "@/services/map.service";
import {
  Module,
  Mutation,
  MutationAction,
  Action,
  VuexModule,
} from "vuex-module-decorators";
import CityPyO from './cityPyO';

export const defaultAbmScenarioConfiguration: AbmScenarioConfiguration = {
  bridge_hafencity: true,
  underpass_veddel_north: true,
  roof_amenities: "complementary",
  blocks: "open",
  main_street_orientation: "horizontal"
};

@Module({ namespaced: true })
export default class AbmStore extends VuexModule {
  scenarioConfig: AbmScenarioConfiguration = {
    ...defaultAbmScenarioConfiguration,
  };
  result: AbmResult | null = null;
  animateLayer = false;

  get scenarioConfiguration(): AbmScenarioConfiguration {
    return this.scenarioConfig;
  }

  get abmResult(): AbmResult {
    return this.result;
  }

  get animateAbmTripsLayer(): boolean {
    return this.animateLayer;
  }

  get cityPyo(): CityPyO {
    return this.context.rootState.cityPyO;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: AbmScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @Mutation
  mutateAnimateLayer(animateLayer: boolean): void {
    this.animateLayer = animateLayer;
  }

  @Mutation
  mutateResult(newResult: AbmResult): void {
    this.result =  newResult
    /** TODO refactor FREEZE OBJECT
      geojson: Object.freeze(newResult.geojson),
      rainData: newResult.rainData,
    };
    */
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  @MutationAction({ mutate: ["result"] })
  async updateAbmResult(
    cityPyOUserid: string
  ): Promise<{ result: AbmResult }> {
    const simulationResult: AbmResult =
      await this.cityPyo.getAbmResultLayer(
        cityPyOUserid,
        this.scenarioConfiguration,
      );

      console.log("simulation resutl", simulationResult)
      debugger;

    return { result: simulationResult };
  }

  @Action({})
  // TODO refactor does it need to be current timestamp?? 
  updateAbmLayers([map, currentTimeStamp = 0]): void {
    const tripsLayer = buildTripsLayer(this.abmResult, currentTimeStamp);
    addDeckLayerToMap(tripsLayer, map);
    
    const data = {} // TODO refactor process abmResult -> heatLayerdata
    const heatMapLayer = buildAggregationLayer(data);
    addDeckLayerToMap(heatMapLayer, map);
  }
}
