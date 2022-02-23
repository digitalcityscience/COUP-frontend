<template>
  <div id="scenario" ref="scenario">
    <!-- google maps style legend at bottom -->
    <Legend :topic="'noise'" :showAtBottom="true"></Legend>
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
          <h2>Traffic Noise | Scenario Settings</h2>
          <!-- Traffic Percentage -->
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">
              TRAFFIC VOLUME <br />
              In project area
            </header>
            <v-slider
              v-model="scenarioConfiguration.traffic_quota"
              step="0.25"
              thumb-label="always"
              label="%"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="['0%', '25%', '50%', '75%', '100%']"
              min="0"
              max="1"
              dark
              flat
              :disabled="resultLoading"
            ></v-slider>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">
              SPEED LIMIT <br />
              In project area
            </header>
            <v-radio-group v-model="scenarioConfiguration.max_speed">
              <v-radio
                :value="30"
                flat
                label="30 kmh/h"
                dark
                :disabled="resultLoading"
              />
              <v-radio
                :value="50"
                flat
                label="50 kmh/h"
                dark
                :disabled="resultLoading"
              />
            </v-radio-group>
          </div>
          <p v-if="errMsg" class="warning" data-cy="result-loading-error">
            {{ errMsg }}
          </p>
          <v-btn
            @click="runScenario"
            class="confirm_btn mt-2"
            :class="{ changesMade: isFormDirty }"
            :disabled="resultLoading"
            data-cy="run-scenario-button"
          >
            Run Scenario
          </v-btn>
          <v-btn
            style="
              margin-top: 1vh;
              margin-bottom: 1vh;
              float: right;
              max-width: 30px;
            "
            @click="saveNoiseScenario"
            class="confirm_btn"
            :disabled="isFormDirty || isScenarioAlreadySaved || resultLoading"
            :dark="isFormDirty || isScenarioAlreadySaved"
          >
            Save
          </v-btn>
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
                          {{ scenario.traffic_quota * 100 }}% Traffic | Max
                          Speed: {{ scenario.max_speed }}
                        </span>
                      </v-btn>
                    </template>
                    <span
                      >{{ scenario.traffic_quota * 100 }}% Traffic|
                      {{ scenario.max_speed }}km/h</span
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
        <h2>Traffic Noise | Dashboard</h2>
        <p>To be developed</p>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="info" data-pic="mdi-information-variant">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'info'" class="component_content">
        <h2>Traffic Noise | About</h2>
        <div class="info_section">
          <Legend v-bind:topic="'noise'"></Legend>

          <!-- text block with subtext blocks, fade out to end to hint for scrolling -->
          <!-- legend color same as background! -->
          <h4>TRAFFIC VOLUME</h4>
          <div class="info_text">
            Volume of motorized traffic (cars, trucks). Selecting 100% shows the
            traffic volume according to current planning assumptions (predicted
            traffic volume). Selecting 25%, for example, shows 25% of the
            predicted traffic volume. This is concerning traffic on the
            Grasbrook peninsula only.
          </div>
          <h4>SIMULATION</h4>
          <div class="info_text">
            The noise simulation is adapted from the software NoiseModelling
            (https://noise-planet.org/noisemodelling.html), a free and
            open-source tool for producing environmental noise maps using a
            simplified implementation of the French national method NMPB-08, The
            calculation method is almost compliant with the CNOSSOS-EU standard
            method for noise emission (only road traffic) and noise propagation.
            The software is developed by the French Institute of Science and
            Technology for Transport, Development and Networks (Ifsttar).
          </div>

          <h4>COLOR SCHEME</h4>
          <div class="info_text">
            The composition of the eleven-class scheme for the presentation of
            noise immission, e.g. the combined use of colors that are similar to
            the presented colors according to visual assessment or due to their
            color codes, by Beate Tomio is licensed under a Creative Commons
            Attribution – NonCommercial – NoDerivatives 4.0 International
            License. Used with permission. Find out more:
            https://www.coloringnoise.com
          </div>
        </div>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { mapState, Store } from "vuex";
import {
  MapboxMap,
  SavedNoiseScenarioConfiguration,
  StoreStateWithModules,
} from "@/models";
import type {
  MenuLink,
  NoiseScenarioConfiguration,
  NoiseResult,
  GeoJSON,
} from "@/models";
import Legend from "@/components/Scenario/Legend.vue";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import LoaderScreen from "@/components/Loader/Loader.vue";
import DashboardCharts from "./DashboardCharts.vue";
import ScenarioComponentNames from "@/config/scenarioComponentNames";
import NoiseResultLayerConfig from "@/config/calculationModuleResults/noiseResultLayerConfig";
import {
  hideAllLayersButThese,
  removeSourceAndItsLayersFromMap,
  hideLayers,
  addSourceAndLayerToMap,
} from "@/services/map.service";
import trafficCountLayerConfig from "@/config/calculationModuleResults/trafficCountsLayerConfig";
import { applyTrafficQuota } from "@/store/noise";
import { cityPyOUserid } from "@/services/authn.service";

@Component({
  name: ScenarioComponentNames.noise,
  components: { MenuComponentDivision, LoaderScreen, DashboardCharts, Legend },
})
export default class NoiseScenario extends Vue {
  $store: Store<StoreStateWithModules>;
  activeDivision = null;
  scenarioConfiguration: NoiseScenarioConfiguration | null = null;

  /** LIFE CYCLE   */
  mounted(): void {
    this.scenarioConfiguration = { ...this.scenarioConfigurationGlobal };
    // hide all other layers
    hideAllLayersButThese(this.map, ["noise", "trafficCounts"]);
    // fetching static geoJSON with trafficCountPoints
    this.$store.dispatch("noise/fetchTrafficCountPointsGeoJSON");
  }

  /** METHODS */
  runScenario(): void {
    // update noise scenario in store
    this.scenarioConfigurationGlobal = Object.assign(
      {},
      this.scenarioConfiguration
    );
    this.calculateNoiseResult();
  }

  async calculateNoiseResult() {
    this.errMsg = "";
    this.$store.commit("noise/resetResult");
    this.$store
      .dispatch(
        "noise/triggerCalculation",
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
      .dispatch("noise/fetchResult")
      .then(() => {
        // success
        this.$store.commit("scenario/noiseMap", true); // this is for the layer menu in the viewbar
        this.addResultToMap(this.noiseResult.geojson);
        // hide the noise layer, if the user meanwhile has switched to another component
        if (!this.activeComponentIsNoise) {
          hideLayers(this.map, [NoiseResultLayerConfig.layerConfig.id]);
        }
      })
      .catch((err) => {
        // fail
        this.$store.commit("scenario/noiseMap", false); // // this is for the layer menu in the viewba
        removeSourceAndItsLayersFromMap("noise", this.map);
        // TODO what about traffic infos
        this.errMsg = err;
        console.error(err.stack);
      })
      .finally(() => {
        this.resultLoading = false;
      });
  }

  addResultToMap(resultGeoJSON: GeoJSON): void {
    // delete old mapSource from map
    removeSourceAndItsLayersFromMap(NoiseResultLayerConfig.source.id, this.map);
    // add result data to map source
    NoiseResultLayerConfig.source.options.data = resultGeoJSON;
    // add new source and layer to map
    addSourceAndLayerToMap(
      NoiseResultLayerConfig.source,
      [NoiseResultLayerConfig.layerConfig],
      this.map
    );
    this.addTrafficCountLayerToMap();
  }

  addTrafficCountLayerToMap(): void {
    // delete old mapSource from map
    removeSourceAndItsLayersFromMap(
      trafficCountLayerConfig.source.id,
      this.map
    );

    // add result data to map source
    trafficCountLayerConfig.source.options.data = applyTrafficQuota(
      this.trafficCountPointsGeoJSON,
      this.scenarioConfigurationGlobal.traffic_quota
    );

    // add new source and layer to map
    addSourceAndLayerToMap(
      trafficCountLayerConfig.source,
      [trafficCountLayerConfig.layerConfig],
      this.map
    );
  }

  loadSavedScenario(savedScenario: SavedNoiseScenarioConfiguration): void {
    this.scenarioConfiguration.max_speed = savedScenario.max_speed;
    this.scenarioConfiguration.traffic_quota = savedScenario.traffic_quota;

    this.runScenario();
  }

  saveNoiseScenario() {
    if (!this.isScenarioAlreadySaved) {
      // add current scenario to saved scenarios
      this.$store.commit(
        "noise/addSavedScenarioConfiguration",
        this.scenarioConfiguration
      );
    }
  }

  get hasNoiseResult(): boolean {
    return this.$store.getters["noise/hasNoiseResult"];
  }

  /** GETTER / SETTER FOR GLOBAL VARIABLES FROM STORE */
  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get savedScenarioConfigurations(): SavedNoiseScenarioConfiguration[] {
    return this.$store.getters["noise/savedScenarioConfigurations"];
  }

  get noiseResult(): NoiseResult {
    return this.$store.getters["noise/noiseResult"];
  }

  get trafficCountPointsGeoJSON(): GeoJSON {
    return this.$store.getters["noise/trafficCountPointsGeoJSON"];
  }

  get scenarioConfigurationGlobal(): NoiseScenarioConfiguration {
    return this.$store.getters["noise/scenarioConfiguration"];
  }
  set scenarioConfigurationGlobal(
    newScenarioConfiguration: NoiseScenarioConfiguration
  ) {
    this.$store.commit(
      "noise/mutateScenarioConfiguration",
      newScenarioConfiguration
    );
  }

  get resultLoading(): boolean {
    return this.$store.state.scenario.resultLoadingStati.noise;
  }

  set resultLoading(loadingState: boolean) {
    let loadingStati = Object.assign(
      {},
      this.$store.state.scenario.resultLoadingStati
    );
    loadingStati.noise = loadingState;
    this.$store.commit("scenario/resultLoadingStati", loadingStati);
  }

  get errMsg(): string {
    return this.$store.state.noise.errMsg;
  }

  set errMsg(msg: string) {
    this.$store.commit("noise/mutateErrMsg", msg);
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
        hidden: false,
      },
      {
        title: "info",
        icon: "mdi-information-variant",
        hidden: false,
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
      savedScenarios.filter((savedScen: SavedNoiseScenarioConfiguration) => {
        return (
          savedScen.max_speed === this.scenarioConfigurationGlobal.max_speed &&
          savedScen.traffic_quota ===
            this.scenarioConfigurationGlobal.traffic_quota
        );
      }).length > 0;

    return isSaved;
  }

  get activeComponentIsNoise(): boolean {
    return (
      this.$store.state.activeMenuComponent === ScenarioComponentNames.noise
    );
  }
}
</script>

<style scoped lang="scss">
@import "../../style.main.scss";
</style>
