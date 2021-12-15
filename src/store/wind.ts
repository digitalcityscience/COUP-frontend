import type {
  CalculationTask,
  SavedWindScenarioConfiguration,
  WindScenarioConfiguration,
  WindResult
} from "@/models";
import { cityPyOUserid } from "@/services/authn.service";
import * as calcModules from "@/services/calculationModules.service";
import {
  Action,
  Module,
  Mutation,
  MutationAction,
  VuexModule,
} from "vuex-module-decorators";
import WindLayer from "@/config/windLayer.json";


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


// TODO can we avoid duplicate code here? 
// @DOBO, I tried interface as you know them from not-javascript. but the concept doesnt seem to be the same.
@Module({ namespaced: true })
export default class WindStore extends VuexModule {
  scenarioConfig: WindScenarioConfiguration = {
    ...defaultWindConfiguration,
  };
  
  savedScenarioConfigs: SavedWindScenarioConfiguration[] = defaultWindScenarioConfigs;

  calcTask: CalculationTask | null = null;
  
  result: WindResult | null = null;

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
      complete: newResult.complete,
      tasksCompleted: newResult.tasksCompleted
    };
  }

  @Mutation
  resetResult(): void {
    this.result = null;
  }

  /** TODO 
   * For multilayer analysis "addSubSelectionLayer" 
   * we need to have possibility to only get result without displaying it. 
   * 
   * each module should implement these methods 
   * "triggerCalculation -> CalculationTask"
   * "fetch Results" -> Result (geojson, tasks_completed, taskCount)
   * "task completed" => ( tasks_completed && tasks_completed === taskCount) -> boolean
   * "Add results to map" -> void
   * 
   * 
   * // Mutations
   * mutateScenarioConfig
   * addSavedScenarioConfig
   * mutateResult
   * 
   * // getters
   * scenarioConfig
   * savedScenarioConfigs
   * calcTask
   * isResultComplete
   * getResult
   * 
   * */


  // TODO why is this working without a specified @Mutation method?? 
  @MutationAction({ mutate: ["calcTask"] })
  async triggerWindCalculation(): Promise<{ calcTask: CalculationTask }> {
    // request calculation and fetch results
    const task: CalculationTask = 
      await calcModules.requestCalculationWind(
        this.scenarioConfiguration,
        cityPyOUserid()
    );
    return { calcTask: task };
  }

  @MutationAction({ mutate: ["result"] })
  async updateWindResult(): Promise<{ result: WindResult }> {
    const simulationResult: WindResult = await calcModules.getResultForWind(this.calculationTask);

    // new result? then update wind layer
    if (!this.windResult || (simulationResult.tasksCompleted > this.windResult.tasksCompleted)) {
      this.context.dispatch("updateWindLayer", simulationResult)
      this.context.commit("scenario/windLayer", true, {root: true}); // this is for the layer menu in the viewbar
    }
    return { result: simulationResult };
  }

  @Action({})
  async updateWindLayer(result: WindResult) {
    // delete old mapSource from map
    this.context.dispatch("removeSourceFromMap", WindLayer.mapSource.id, { root: true });

    // format result as map source
    const mapSource = calcModules.formatResultAsMapSource(WindLayer.mapSource.id, result.geojson)

    // add new source and layer to map
    this.context.dispatch("addSourceToMap", mapSource, { root: true })
      .then(() => {
        this.context.dispatch("addLayerToMap", WindLayer.layer, { root: true })
      });
  }     
}
