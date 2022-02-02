<script lang="ts">
import Legend from "@/components/Scenario/Legend.vue";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import LoaderScreen from "@/components/Loader/Loader.vue";
import { Component, Vue } from "vue-property-decorator";
import { Store } from "vuex";
import {
  MapboxMap,
  SavedWindScenarioConfiguration,
  StoreStateWithModules,
} from "@/models";
import type {
  MenuLink,
  WindScenarioConfiguration,
  WindResult,
  GeoJSON,
} from "@/models";
import { defaultWindScenarioConfigs } from "@/store/wind";
import * as calcModules from "@/services/calculationModules.service";
import {
  addSourceAndLayerToMap,
  hideAllLayersButThese,
  hideLayers,
  removeSourceAndItsLayersFromMap,
} from "@/services/map.service";
import WindResultLayerConfig from "@/config/calculationModuleResults/windResultLayerConfig";
import DashboardCharts from "./DashboardCharts.vue";
import ScenarioComponentNames from "@/config/scenarioComponentNames";
import { cityPyOUserid } from "@/services/authn.service";

@Component({
  name: ScenarioComponentNames.wind,
  components: { MenuComponentDivision, LoaderScreen, DashboardCharts, Legend },
})
export default class WindScenario extends Vue {
  $store: Store<StoreStateWithModules>;
  activeDivision = null;
  scenarioConfiguration: WindScenarioConfiguration | null = null;

  /** LIFE CYCLE   */
  mounted(): void {
    this.scenarioConfiguration = { ...this.scenarioConfigurationGlobal };
    // hide all other layers
    hideAllLayersButThese(this.map, ["wind"]);
  }

  /** METHODS */

  runScenario(): void {
    // update wind scenario in store
    this.scenarioConfigurationGlobal = Object.assign(
      {},
      this.scenarioConfiguration
    );
    this.calculateWindResult();
  }

  async calculateWindResult() {
    this.errMsg = "";
    this.$store.commit("wind/resetResult");
    this.$store
      .dispatch(
        "wind/triggerCalculation",
        cityPyOUserid(this.$store.state?.cityPyO)
      )
      .then(() => {
        this.waitForResults();
      })
      .catch(() => {
        // fail
        this.errMsg = "Failed to trigger calculation. Try again.";
      });
  }

  // is busy until result complete
  async waitForResults() {
    this.resultLoading = true;
    this.$store
      .dispatch("wind/fetchResult")
      .then(() => {
        // success
        this.$store.commit("scenario/windLayer", true); // this is for the layer menu in the viewbar
        this.addResultToMap(this.windResult.geojson);
        // hide the wind layer, if the user meanwhile has switched to another component
        if (!this.activeComponentIsWind) {
          hideLayers(this.map, [WindResultLayerConfig.layerConfig.id]);
        }
      })
      .catch((err) => {
        // fail
        this.$store.commit("scenario/windLayer", false); // // this is for the layer menu in the viewba
        removeSourceAndItsLayersFromMap("wind", this.map);
        this.errMsg = err;
        console.error(err.stack);
        //debugger;
      })
      .finally(() => {
        this.resultLoading = false;
      });
  }

  addResultToMap(resultGeoJSON: GeoJSON): void {
    // delete old mapSource from map
    removeSourceAndItsLayersFromMap(WindResultLayerConfig.source.id, this.map);
    // add result data to map source
    WindResultLayerConfig.source.options.data = resultGeoJSON;
    // add new source and layer to map
    addSourceAndLayerToMap(
      WindResultLayerConfig.source,
      [WindResultLayerConfig.layerConfig],
      this.map
    );
  }

  loadSavedScenario(savedScenario: SavedWindScenarioConfiguration): void {
    this.scenarioConfiguration.wind_speed = savedScenario.wind_speed;
    this.scenarioConfiguration.wind_direction = savedScenario.wind_direction;

    this.runScenario();
  }

  saveWindScenario() {
    if (!this.isScenarioAlreadySaved) {
      // add current scenario to saved scenarios
      this.$store.commit(
        "wind/addSavedScenarioConfiguration",
        this.scenarioConfiguration
      );
    }
  }

  get hasWindResult(): boolean {
    return this.$store.getters["wind/hasWindResult"];
  }

  /** GETTER / SETTER FOR GLOBAL VARIABLES FROM STORE */
  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get savedScenarioConfigurations(): SavedWindScenarioConfiguration[] {
    return this.$store.getters["wind/savedScenarioConfigurations"];
  }

  get windResult(): WindResult {
    return this.$store.getters["wind/windResult"];
  }

  get scenarioConfigurationGlobal(): WindScenarioConfiguration {
    return this.$store.getters["wind/scenarioConfiguration"];
  }
  set scenarioConfigurationGlobal(
    newScenarioConfiguration: WindScenarioConfiguration
  ) {
    this.$store.commit(
      "wind/mutateScenarioConfiguration",
      newScenarioConfiguration
    );
  }

  get resultLoading(): boolean {
    return this.$store.state.scenario.resultLoadingStati.wind;
  }

  set resultLoading(loadingState: boolean) {
    let loadingStati = Object.assign(
      {},
      this.$store.state.scenario.resultLoadingStati
    );
    loadingStati.wind = loadingState;
    this.$store.commit("scenario/resultLoadingStati", loadingStati);
  }

  get errMsg(): string {
    return this.$store.state.wind.errMsg;
  }

  set errMsg(msg: string) {
    this.$store.commit("wind/mutateErrMsg", msg);
  }

  /** GETTERS FOR LOCAL VARIABLES */
  get componentDivisions(): MenuLink[] {
    return [
      {
        title: "Scenario",
        icon: "mdi-map-marker-radius",
        hidden: false,
        default: true,
      },
      {
        title: "Dashboard",
        icon: "mdi-view-dashboard",
      },
      {
        title: "info",
        icon: "mdi-information-variant",
      },
    ];
  }

  get isFormDirty(): boolean {
    return (
      JSON.stringify(this.scenarioConfiguration) !==
      JSON.stringify(this.scenarioConfigurationGlobal)
    );
  }

  get isScenarioAlreadySaved() {
    const savedScenarios = this.savedScenarioConfigurations;
    const isSaved =
      savedScenarios.filter((savedScen: SavedWindScenarioConfiguration) => {
        return (
          savedScen.wind_speed ===
            this.scenarioConfigurationGlobal.wind_speed &&
          savedScen.wind_direction ===
            this.scenarioConfigurationGlobal.wind_direction
        );
      }).length > 0;

    return isSaved;
  }

  get activeComponentIsWind(): boolean {
    return (
      this.$store.state.activeMenuComponent === ScenarioComponentNames.wind
    );
  }
}
</script>

<template>
  <div id="scenario" ref="scenario">
    <!-- google maps style legend at bottom -->
    <Legend :topic="'wind'" :showAtBottom="true"></Legend>
    <MenuComponentDivision
      :menuLinks="componentDivisions"
      :highlighted="activeDivision"
      @active="activeDivision = $event"
    />
    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div
        v-if="activeDivision === 'Scenario'"
        class="component_content scenario"
      >
        <v-container fluid>
          <h2>Wind Comfort | Scenario Settings</h2>
          <!-- Wind Direction -->
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">
              WIND DIRECTION
              {{ scenarioConfiguration.wind_direction }}°
            </header>
            <v-slider
              v-model="scenarioConfiguration.wind_direction"
              step="15"
              thumb-label="always"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="[
                'N',
                '',
                '',
                '',
                '',
                '',
                'E',
                '',
                '',
                '',
                '',
                '',
                'S',
                '',
                '',
                '',
                '',
                '',
                'W',
                '',
                '',
                '',
                '',
                '',
              ]"
              min="0"
              max="345"
              dark
              flat
              :disabled="resultLoading"
            ></v-slider>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">
              WIND SPEED
              {{ scenarioConfiguration.wind_speed }} km/h
            </header>
            <v-slider
              v-model="scenarioConfiguration.wind_speed"
              step="5"
              thumb-label="always"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="[
                '0',
                '',
                '',
                '',
                '20',
                '',
                '',
                '',
                '40',
                '',
                '',
                '',
                '60',
                '',
                '',
                '',
                '80',
              ]"
              min="0"
              max="80"
              dark
              flat
              :disabled="resultLoading"
            ></v-slider>
          </div>
          <p v-if="errMsg" class="warning">
            {{ errMsg }}
          </p>
          <v-btn
            @click="runScenario"
            class="confirm_btn mt-2"
            :class="{ changesMade: isFormDirty }"
            :disabled="resultLoading"
          >
            RUN SCENARIO
          </v-btn>

          <v-card-actions class="d-flex flex-column">
            <v-btn
              style="
                margin-top: 1vh;
                margin-bottom: 1vh;
                float: right;
                max-width: 30px;
              "
              @click="saveWindScenario"
              class="confirm_btn ml-auto"
              :disabled="
                isFormDirty ||
                isScenarioAlreadySaved ||
                resultLoading ||
                !hasWindResult
              "
              :dark="isScenarioAlreadySaved"
            >
              SAVE
            </v-btn>
            <span
              v-if="isScenarioAlreadySaved && hasWindResult"
              class="ml-auto"
              style="font-weight: bold"
              >Scenario already saved
            </span>
            <span
              v-if="hasWindResult"
              class="ml-auto"
              style="font-weight: bold"
            >
              Showing results for:
              {{ scenarioConfigurationGlobal.wind_speed }}km/h |
              {{ scenarioConfigurationGlobal.wind_direction }}°
            </span>
          </v-card-actions>

          <!--saved scenarios -->
          <div class="saved_scenarios" style="margin-top: 5vh">
            <h4>RELOAD A SAVED SCENARIO</h4>
            <v-data-iterator
              :items="savedScenarioConfigurations"
              :hide-default-footer="true"
            >
              <template v-slot:default="{ items }">
                {{/* Use the items to iterate */}}
                <v-flex v-for="(scenario, index) in items" :key="index">
                  <v-tooltip left>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn
                        style="margin: 1vh auto"
                        @click="loadSavedScenario(scenario)"
                        outlined
                        dark
                        small
                        :disabled="resultLoading"
                        v-bind="attrs"
                        v-on="on"
                      >
                        <span v-if="scenario.label">
                          {{ scenario.label }}
                        </span>
                        <span v-if="!scenario.label">
                          Direction: {{ scenario.wind_direction }} | Speed:
                          {{ scenario.wind_speed }}
                        </span>
                      </v-btn>
                    </template>
                    <span
                      >{{ scenario.wind_speed }}km/h |
                      {{ scenario.wind_direction }}°</span
                    >
                  </v-tooltip>
                </v-flex>
              </template>
            </v-data-iterator>
          </div>
        </v-container>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="Dashboard" data-pic="mdi-view-dashboard">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Wind Comfort | Dashboard</h2>
        <p>To be developed</p>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="info" data-pic="mdi-information-variant">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div
        v-if="activeDivision === 'info'"
        class="component_content"
        style="margin-top: 0"
      >
        <h2>Wind Comfort | About</h2>
        <Legend v-bind:topic="'wind'"></Legend>
        <div class="info_section">
          <h4>WHAT IS WIND COMFORT?</h4>
          <div class="info_text">
            Wind comfort is a categorization of wind speed at pedestrian level
            (1.75 meters above ground level) according to activities that can
            comfortably be performed. For example, low wind speed are preferable
            when sitting in a park bench. Higher wind speeds, on the other hand,
            are acceptable when going out for a run. The wind speed results are
            grouped into categories according to the Lawson Criteria for wind
            comfort. Understanding wind comfort is important for informing
            design decisions about urban morphology and open space design, and
            for determining appropriate uses of open space.
          </div>
          <h4>FAST CALCULATION TIMES—ML AND CFD</h4>
          <div class="info_text">
            The wind comfort calculation is a prediction of a computational
            fluid dynamic (CFD) simulation for the given wind speed and
            direction. The InFraRed model is trained using machine learning on
            3D CFD data. “Training” a simulation model makes it possible to run
            near real-time simulations using web-based applications. The
            accuracy of the model ranges between 80 and 95%. The InFraRed wind
            comfort model was developed by the City Intelligence Lab at the
            Austrian Institute of Technology.
          </div>
          <h4>WHY DO THE RESULTS APPEAR AS TILES?</h4>
          <div class="info_text">
            The results displayed in the Grasbrook CityScope are carried out in
            real-time. Despite significant time savings enabled by the
            ML-trained model, the calculation is still computationally intense.
            For this reason, the InFraRed server performs calculations in
            batches of up to 500x500m square tiles. Information about the
            building location and height is sent as geospatial data from the
            Grasbrook CityScope database, CityPyO, to the InFraRed API. The
            calculation results are then sent back and displayed on the
            Grasbrook CityScope frontend.
            <br />
          </div>
        </div>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

.v-input {
  display: block;
}
</style>
