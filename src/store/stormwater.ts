import { swLayerName } from "@/config/layers";
import type { GeoJSON, StormWaterScenarioConfiguration } from "@/models";
import {
  getSimulationResultForScenario,
  request_calculation,
} from "@/store/scenario/calculationModules";
import {
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";

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

  geoJsonResult: GeoJSON | null = null;

  get geoJson(): GeoJSON {
    return this.geoJsonResult;
  }

  get scenarioConfiguration(): StormWaterScenarioConfiguration {
    return this.scenarioConfig;
  }

  @Mutation
  mutateScenarioConfiguration(
    newScenarioConfiguration: StormWaterScenarioConfiguration
  ): void {
    this.scenarioConfig = { ...newScenarioConfiguration };
  }

  @MutationAction({ mutate: ["geoJsonResult"] })
  async updateStormWaterLayer(
    userId: string
  ): Promise<{ geoJsonResult: GeoJSON }> {
    const scenario = {
      roofs: this.scenarioConfiguration.roofs,
      flow_path: this.scenarioConfiguration.flowPath,
      return_period: this.scenarioConfiguration.returnPeriod,
      result_format: "geojson",
      city_pyo_user: userId, //rootState.cityPyO.userid,
    };

    // request calculation and fetch results
    const stormWaterResultUuid = await request_calculation(
      swLayerName,
      scenario
    );
    const simulationResult = await getSimulationResultForScenario(
      swLayerName,
      stormWaterResultUuid
    );

    return {
      geoJsonResult: Object.freeze(simulationResult.source.options.data),
    };
  }
}
