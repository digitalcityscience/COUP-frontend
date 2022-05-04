<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import {
  filterAndScaleLayerData,
  showMultiLayerAnalysis,
} from "@/store/scenario/multiLayerAnalysis";
import SubSelectionLayerConfig from "@/config/multiLayerAnalysis/subSelectionLayerConfig";
import mdiInformationPng from "@/assets/mdi-information.png";
import CombinedLayersConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import PerformanceInfoLayerConfig from "@/config/multiLayerAnalysis/performaceInfosConfig";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import type { MenuLink } from "@/models";
import {
  hideAllLayersButThese,
  hideLayers,
  hideAllResultLayers,
} from "@/services/map.service";
import ScenarioComponentNames from "@/config/scenarioComponentNames";
import { cityPyOUserid } from "@/services/authn.service";

export default {
  name: ScenarioComponentNames.multiLayer,
  components: { MenuComponentDivision },
  data() {
    return {
      activeDivision: null,
      showError: false,
      missingInputScenarios: [],
      showMissingScenarios: false,
      layersReadyToCompare: [],
      layerChoice_1: null,
      layerChoice_2: null,
      criteriaChoice_1: null,
      criteriaChoice_2: null,
      sliderValues_1: [],
      sliderValues_2: [],
      criteriaLayer_1: null,
      criteriaLayer_2: null,
      enableCriteriaLayer_1: false,
      enableCriteriaLayer_2: false,
      emptyDataWarning: false,
      resultOutdated: false,
      allResultCriteria: [
        // TODO adjust ranges for amenity stats!??
        // add corresponding result file source in multiLayerAnalysis.ts  -> layerLookup()
        {
          layerName: "Noise",
          label: "Traffic Noise",
          value: "noise",
          unit: "dB",
          range: [45, 80],
          step: 5,
        },
        {
          layerName: "Abm",
          label: "Pedestrian Density",
          value: "pedestrianDensity",
          unit: "pedestrians/m²",
          range: [0, 0.3],
          step: 0.01,
        },
        {
          layerName: "Abm",
          label: "Amenity Types",
          value: "Amenity Types",
          unit: "unique place types",
          range: [0, 20],
          step: 1,
        },
        {
          layerName: "Abm",
          label: "Amenity Density",
          value: "Density",
          unit: "places/km²",
          range: [0, 850],
          step: 1,
        },
        {
          layerName: "Wind",
          label: "Wind Speed",
          value: "wind",
          unit: "Lawson Criteria",
          range: [0, 1],
          step: 0.2,
        },
        {
          layerName: "Sun",
          label: "Sun Exposure",
          value: "sun",
          unit: "h/day",
          range: [0, 1],
          step: 0.1,
        },
      ],
      availableResultCriteria: [],
      criteriaOptions_1: [],
      criteriaOptions_2: [],
      presetOptions: {
        Custom: [0, 100],
        "Very Low": [0, 10],
        Low: [0, 33],
        Medium: [33, 66],
        High: [66, 100],
        "Very High": [90, 100],
      },
      preset_1: "High",
      preset_2: "High",
      logicOptions: [
        { label: "AND", value: "and" },
        { label: "AND NOT", value: "and_not" },
      ],
      logicOperator: null,
      resultLookups: {},
      allSimulationResults: null,
      combinedLayers: null,
    };
  },
  computed: {
    ...mapState(["map"]), // getter only
    // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
    ...generateStoreGetterSetter([
      ["activeMenuComponent", "activeMenuComponent"],
      ["windScenarioHash", "scenario/windScenarioHash"],
      ["abmSettings", "scenario/moduleSettings"],
    ]),
    currentAbmResult() {
      return this.$store.getters["abm/abmResult"];
    },
    currentNoiseResult() {
      return this.$store.getters["noise/noiseResult"];
    },
    currentWindResult() {
      return this.$store.getters["wind/windResult"];
    },
    currentWindScenario() {
      return this.$store.getters["wind/scenarioConfiguration"];
    },
    currentNoiseScenario() {
      return this.$store.getters["noise/scenarioConfiguration"];
    },
    currentSunResult() {
      return this.$store.state.scenario.sunExposureGeoJson;
    },
    componentDivisions(): MenuLink[] {
      return [
        {
          title: "Scenario",
          icon: "mdi-map-marker-radius",
          hidden: false,
          default: true,
        },
      ];
    },
    resultLoading: {
      // getter
      get: function () {
        return this.$store.state.scenario.resultLoadingStati.multiLayer;
      },
      // setter
      set: function (loadingState) {
        let loadingStati = Object.assign(
          {},
          this.$store.state.scenario.resultLoadingStati
        );
        loadingStati.multiLayer = loadingState;
        this.$store.commit("scenario/resultLoadingStati", loadingStati);
      },
    },
  },
  watch: {
    layerChoice_1(newVal, oldVal) {
      // update options for selectable indexes (to be combined to new layer)
      this.criteriaOptions_1 = this.availableResultCriteria.filter((option) => {
        return option.layerName === this.layerChoice_1;
      });
      this.criteriaChoice_1 = this.criteriaOptions_1[0];
      this.sliderValues_1 = this.criteriaChoice_1.range;
    },
    layerChoice_2(newVal, oldVal) {
      this.criteriaOptions_2 = this.availableResultCriteria.filter((option) => {
        return option.layerName === this.layerChoice_2;
      });
      this.criteriaChoice_2 = this.criteriaOptions_2[0];
      this.sliderValues_2 = this.criteriaChoice_2.range;
    },
    criteriaChoice_1: {
      deep: true,
      handler() {
        if (this.criteriaChoice_1.label === this.criteriaChoice_2.label) {
          this.showError = true;
        } else {
          this.sliderValues_1 = this.getValueForPreset(
            this.preset_1,
            this.criteriaChoice_1.range
          );
          const request = {
            layerName: this.criteriaChoice_1.value,
            layerRange: this.criteriaChoice_1.range,
            layerConstraints: this.sliderValues_1,
          };
          this.criteriaLayer_1 = filterAndScaleLayerData(request);
        }
      },
    },
    criteriaChoice_2: {
      deep: true,
      handler() {
        if (this.criteriaChoice_1.label === this.criteriaChoice_2.label) {
          this.showError = true;
        } else {
          this.sliderValues_2 = this.getValueForPreset(
            this.preset_2,
            this.criteriaChoice_2.range
          );
          const request = {
            layerName: this.criteriaChoice_2.value,
            layerRange: this.criteriaChoice_2.range,
            layerConstraints: this.sliderValues_2,
          };
          this.criteriaLayer_2 = filterAndScaleLayerData(request);
        }
      },
    },
    sliderValues_1: {
      deep: true,
      handler() {
        const request = {
          layerName: this.criteriaChoice_1.value,
          layerRange: this.criteriaChoice_1.range,
          layerConstraints: this.sliderValues_1,
        };
        this.criteriaLayer_1 = filterAndScaleLayerData(request);
        this.emptyDataWarning = this.criteriaLayer_1.features.length === 0;
        if (this.enableCriteriaLayer_1) {
          this.$store.dispatch(
            "scenario/addSubSelectionLayer",
            this.criteriaLayer_1.features
          );
        }
      },
    },
    sliderValues_2: {
      deep: true,
      handler() {
        const request = {
          layerName: this.criteriaChoice_2.value,
          layerRange: this.criteriaChoice_2.range,
          layerConstraints: this.sliderValues_2,
        };
        this.criteriaLayer_2 = filterAndScaleLayerData(request);
        this.emptyDataWarning = this.criteriaLayer_2.features.length === 0;
        if (this.enableCriteriaLayer_2) {
          this.$store.dispatch(
            "scenario/addSubSelectionLayer",
            this.criteriaLayer_2.features
          );
        }
      },
    },
    enableCriteriaLayer_1(showLayer, old) {
      if (showLayer) {
        if (this.enableCriteriaLayer_2) {
          this.enableCriteriaLayer_2 = false;
        }
        this.$store.dispatch(
          "scenario/addSubSelectionLayer",
          this.criteriaLayer_1.features
        );
        hideAllLayersButThese(this.map, [
          SubSelectionLayerConfig.layerConfig.id,
        ]);
      } else {
        // hide subSelectionLayer, if subSelection is not to be shown
        if (!this.enableCriteriaLayer_2) {
          hideLayers(this.map, [SubSelectionLayerConfig.layerConfig.id]);

          if (this.combinedLayers) {
            // show the combined layer if available
            hideAllLayersButThese(this.map, [
              CombinedLayersConfig.layerConfig.id,
              PerformanceInfoLayerConfig.layerConfig.id,
            ]);
          }
        }
      }
    },
    enableCriteriaLayer_2(showLayer, old) {
      if (showLayer) {
        if (this.enableCriteriaLayer_1) {
          this.enableCriteriaLayer_1 = false;
        }
        this.$store.dispatch(
          "scenario/addSubSelectionLayer",
          this.criteriaLayer_2.features
        );
        hideAllLayersButThese(this.map, [
          SubSelectionLayerConfig.layerConfig.id,
        ]);
      } else {
        // hide subSelectionLayer, if subSelection is not to be shown
        if (!this.enableCriteriaLayer_1) {
          this.$store.state.map?.setLayoutProperty(
            SubSelectionLayerConfig.layerConfig.id,
            "visibility",
            "none"
          );
          if (this.combinedLayers) {
            // show the combined layer if available
            hideAllLayersButThese(this.map, [
              CombinedLayersConfig.layerConfig.id,
              PerformanceInfoLayerConfig.layerConfig.id,
            ]);
          }
        }
      }
    },
    layersReadyToCompare: {
      deep: true,
      handler() {
        // check if at least to layers are available for analysis
        if (!(this.layersReadyToCompare.length >= 2)) {
          this.showMissingScenarios = true;
          return;
        }
        this.showMissingScenarios = false;

        // filter layer options for actually available layers
        this.availableResultCriteria = this.allResultCriteria.filter(
          (option) => {
            return this.missingInputScenarios.indexOf(option.layerName) === -1;
          }
        );

        // set initial UI settings if not set yet
        if (!this.layerChoice_1) {
          this.layerChoice_1 = this.layersReadyToCompare[0];
          this.layerChoice_2 = this.layersReadyToCompare[1];
        }
      },
    },
  },
  async beforeMount() {
    this.getResultsFromStore();
    this.determineMissingScenarios();
    this.updateLayerSelectionDropdowns();
  },
  mounted: function () {
    this.logicOperator = this.logicOptions[0];

    // calc input statistics, if all scenarios chosen
    if (this.currentAbmResult) {
      this.resultLoading = true;
      this.$store
        .dispatch("scenario/calculateStatsForMultiLayerAnalysis")
        .then(() => {
          this.resultLoading = false;
        });
    }
    hideAllResultLayers(this.map);
  },
  methods: {
    getResultsFromStore() {
      this.allSimulationResults = {
        Noise: this.currentNoiseResult,
        Abm: this.currentAbmResult,
        Wind: this.currentWindResult,
        Sun: this.currentSunResult,
      };
    },
    determineMissingScenarios() {
      // iterate over scenario results, if a result is empty add the topic to missing Input scenarios
      this.getResultsFromStore();
      console.log("all simresults", this.allSimulationResults);
      this.missingInputScenarios = [];
      this.layersReadyToCompare = [];
      for (const [key, value] of Object.entries(this.allSimulationResults)) {
        if (!value) {
          this.missingInputScenarios.push(key);
        } else {
          this.layersReadyToCompare.push(key);
        }
      }
    },
    async loadDefaultResultFor(layerName) {
      this.resultLoading = true;
      const cityPyOUserId = cityPyOUserid(this.$store.state?.cityPyO);
      switch (layerName) {
        case "Sun":
          await this.$store.dispatch("scenario/addSunExposureLayer");
          break;
        case "Wind":
          await this.$store
            .dispatch("wind/triggerCalculation", cityPyOUserId)
            .then(async () => {
              await this.$store.dispatch("wind/fetchResult");
            });
          break;
        case "Noise":
          await this.$store
            .dispatch("noise/triggerCalculation", cityPyOUserId)
            .then(async () => {
              await this.$store.dispatch("noise/fetchResult");
            });
          break;
        case "Abm":
          await this.$store.dispatch("abm/fetchResult");
          // TODO - do we still need this? // hideAllResultLayers(this.map);
          this.$store
            .dispatch("scenario/calculateStatsForMultiLayerAnalysis")
            .then(() => {
              console.log("stats calc ready");
              this.updateAbmCriteriaLayer();
            });
          break;
        default:
          console.error(
            "cannot load default result for unknown layer",
            layerName
          );
          this.updateLayerSelectionDropdowns();
      }
      this.resultLoading = false;
      // then update missing scenarios and hide result layers
      this.determineMissingScenarios();
      //this.updateLayerSelectionDropdowns()
      hideAllResultLayers(this.map);
    },
    updateAbmCriteriaLayer() {
      // check if at least to layers are available for analysis
      if (this.layerChoice_1 === "Abm") {
        const request = {
          layerName: this.criteriaChoice_1.value,
          layerRange: this.criteriaChoice_1.range,
          layerConstraints: this.sliderValues_1,
        };
        this.criteriaLayer_1 = filterAndScaleLayerData(request);
      }
      if (this.layerChoice_2 === "Abm") {
        const request = {
          layerName: this.criteriaChoice_2.value,
          layerRange: this.criteriaChoice_2.range,
          layerConstraints: this.sliderValues_2,
        };
        this.criteriaLayer_2 = filterAndScaleLayerData(request);
      }
    },
    updateLayerSelectionDropdowns() {
      // check if at least to layers are available for analysis
      if (!(this.layersReadyToCompare.length >= 2)) {
        return;
      }

      // filter layer options for actually available layers
      this.availableResultCriteria = this.allResultCriteria.filter((option) => {
        return this.missingInputScenarios.indexOf(option.layerName) === -1;
      });

      // set initial UI settings if not set yet
      if (!this.layerChoice_1) {
        // layer Selection
        this.layerChoice_1 = this.layersReadyToCompare[0];
        this.layerChoice_2 = this.layersReadyToCompare[1];
        this.enableCriteriaLayer_1 = true;
      }
    },
    inputChanged() {
      if (this.combinedLayers) {
        this.resultOutdated = true;
      }

      this.showError = false;
    },
    getValueForPreset(presetChoice, range) {
      const minPercent = this.presetOptions[presetChoice][0] / 100;
      const maxPercent = this.presetOptions[presetChoice][1] / 100;
      const maxValue = range[1];

      return [maxValue * minPercent, maxValue * maxPercent];
    },
    getScenarioDescriptionFor(layerName) {
      switch (layerName) {
        case "Sun":
          return "DEFAULT SCENARIO";
        case "Wind":
          return (
            "DIRECTION: " +
            this.currentWindScenario["wind_direction"] +
            " | " +
            "SPEED: " +
            this.currentWindScenario["wind_speed"] +
            "km/h"
          );
        case "Noise":
          return (
            "VOLUME: " +
            this.currentNoiseScenario["traffic_quota"] * 100 +
            "%" +
            " | " +
            "SPEED: " +
            this.currentNoiseScenario["max_speed"] +
            "km/h"
          );
        case "Abm":
          return "Scenario 1";

        default:
          console.error(
            "cannot create description for unknown layer",
            layerName
          );
      }
    },
    async showCombinedLayers() {
      this.resultLoading = true;

      // disable editing of layer criteria
      this.enableCriteriaLayer_1 = this.enableCriteriaLayer_2 = false;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!this.combinedLayers || this.resultOutdated) {
        // recombine layers if input options have changed
        this.resultOutdated = false;
        this.combinedLayers = await showMultiLayerAnalysis(
          this.criteriaLayer_1,
          this.criteriaLayer_2,
          this.logicOperator.value
        );
      }

      if (!this.combinedLayers || this.combinedLayers.length === 0) {
        this.emptyDataWarning = true;
      } else {
        this.$store.commit("scenario/multiLayerAnalysisMap", true);
      }

      this.resultLoading = false;
      hideAllLayersButThese(this.map, [
        CombinedLayersConfig.layerConfig.id,
        PerformanceInfoLayerConfig.layerConfig.id,
      ]);
    },
  },
};
</script>

<template>
  <div id="scenario" ref="scenario">
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
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <!-- Choose Layers to combine -->
            <header class="text-sm-left">LAYER SELECTION</header>
            <!-- per row: check button. AND/OR selector. slider per v-select -->
            <!-- set slider min max dynamically -->
            <div v-if="layersReadyToCompare.length >= 2">
              <v-row no-gutters>
                <v-select
                  :disabled="resultLoading"
                  :items="layersReadyToCompare"
                  v-model="layerChoice_1"
                  @change="inputChanged()"
                  item-text="label"
                  item-value="label"
                  solo
                  persistent-hint
                  return-object
                  single-line
                  dark
                  hide-details
                ></v-select>
                <v-select
                  :disabled="resultLoading"
                  :items="layersReadyToCompare"
                  v-model="layerChoice_2"
                  @change="inputChanged()"
                  item-text="label"
                  item-value="label"
                  solo
                  persistent-hint
                  return-object
                  single-line
                  dark
                  hide-details
                ></v-select>
              </v-row>
            </div>
            <!-- Layers not available?? Load defaults! -->
            <div v-if="missingInputScenarios.length">
              <v-row no-gutters class="mb-0" align="start">
                <v-col cols="10">
                  <v-card
                    class="pa-0"
                    tile
                    dark
                    style="background-color: transparent"
                  >
                    <header class="text-sm-left">Layer Not Available?</header>
                  </v-card>
                </v-col>
                <v-col cols="2">
                  <v-icon
                    v-if="!showMissingScenarios"
                    size="10"
                    color="white"
                    @click="showMissingScenarios = !showMissingScenarios"
                    >mdi-triangle mdi-rotate-270</v-icon
                  >
                  <v-icon
                    v-if="showMissingScenarios"
                    size="10"
                    color="white"
                    @click="showMissingScenarios = !showMissingScenarios"
                    >mdi-triangle mdi-rotate-180</v-icon
                  >
                </v-col>
              </v-row>
              <!-- Legend categories as v-for -->
              <template v-if="showMissingScenarios">
                <v-row
                  no-gutters
                  v-for="layerName in missingInputScenarios"
                  :key="layerName"
                  class="mb-2 ml-0"
                >
                  <v-col cols="2" xs="3">
                    <v-card class="mr-2" tile dark style="">
                      <v-icon :color="'white'">mdi-close</v-icon>
                    </v-card>
                  </v-col>
                  <v-col cols="3" xs="9">
                    <v-card
                      class="pa-0"
                      tile
                      dark
                      style="background-color: inherit"
                    >
                      {{ layerName }}
                    </v-card>
                  </v-col>
                  <v-col cols="7" xs="12">
                    <v-card
                      class="pa-0"
                      tile
                      dark
                      style="background-color: inherit"
                    >
                      <v-btn
                        @click="loadDefaultResultFor(layerName)"
                        class="confirm_btn"
                        :class="{ changesMade: resultOutdated }"
                        :disabled="resultLoading"
                        style="min-width: 100%"
                        >Load Default
                      </v-btn>
                    </v-card>
                  </v-col>
                </v-row>
              </template>
            </div>
            <!-- end of missing scenarios -->
          </div>
          <!-- scenario box -->

          <!-- Criteria Selection --->
          <div
            v-if="layersReadyToCompare.length >= 2"
            class="scenario_box"
            :class="resultOutdated ? 'highlight' : ''"
          >
            <header class="text-sm-left">CRITERIA SELECTION</header>
            <v-row style="margin-bottom: -10px">
              <v-col cols="10">
                <v-card
                  class="pa-0"
                  tile
                  dark
                  style="background-color: transparent"
                >
                  <header
                    class="text-sm-left"
                    v-bind:class="enableCriteriaLayer_1 ? '' : 'disabled'"
                    style="font-weight: bold"
                  >
                    {{ layerChoice_1 }}
                  </header>
                  <p style="float: left; font-size: 11px">
                    {{ getScenarioDescriptionFor(layerChoice_1) }}
                  </p>
                </v-card>
              </v-col>
              <v-col cols="2">
                <v-icon
                  v-if="!enableCriteriaLayer_1"
                  color="grey"
                  @click="enableCriteriaLayer_1 = !enableCriteriaLayer_1"
                  :disabled="resultLoading"
                  >mdi-eye-off</v-icon
                >
                <v-icon
                  v-if="enableCriteriaLayer_1"
                  color="white"
                  @click="enableCriteriaLayer_1 = !enableCriteriaLayer_1"
                  >mdi-eye</v-icon
                >
              </v-col>
            </v-row>
            <!-- criteria 1 select -->
            <v-row no-gutters align="start">
              <v-select
                :disabled="!enableCriteriaLayer_1"
                :items="criteriaOptions_1"
                v-model="criteriaChoice_1"
                @change="inputChanged()"
                item-text="label"
                item-value="label"
                :hint="`${criteriaChoice_1.unit}` || ''"
                :label="criteriaChoice_1.label"
                solo
                persistent-hint
                return-object
                single-line
                dark
                hide-details
              ></v-select>
            </v-row>
            <!--- criteria 1 - preset select -->
            <v-row no-gutters>
              <v-select
                :disabled="!enableCriteriaLayer_1"
                :items="Object.keys(presetOptions)"
                v-model="preset_1"
                @change="
                  inputChanged();
                  sliderValues_1 = getValueForPreset(
                    preset_1,
                    criteriaChoice_1.range
                  );
                "
                item-text="label"
                item-value="label"
                solo
                persistent-hint
                :hint="`${criteriaChoice_1.unit}` || ''"
                return-object
                single-line
                dark
              ></v-select>
            </v-row>
            <!-- criteria 1 - slider -->
            <v-row no-gutters align="center">
              <v-col style="margin-top: -35px">
                <v-range-slider
                  :disabled="
                    !enableCriteriaLayer_1 || this.preset_1 !== 'Custom'
                  "
                  @dragstart="(_) => null"
                  @dragend="(_) => null"
                  @mousedown.native.stop="(_) => null"
                  @mousemove.native.stop="(_) => null"
                  @change="inputChanged()"
                  v-model="sliderValues_1"
                  :step="criteriaChoice_1.step"
                  :hint="
                    'Subselection has ' +
                    criteriaLayer_1.features.length +
                    ' features'
                  "
                  label=""
                  persistent-hint
                  thumb-label="always"
                  thumb-size="1"
                  tick-size="50"
                  :min="criteriaChoice_1.range[0]"
                  :max="criteriaChoice_1.range[1]"
                  dark
                  flat
                ></v-range-slider>
              </v-col>
            </v-row>

            <!-- second criteria --->
            <!-- criteria 2 - headline -->
            <v-row no-gutters class="mt-5">
              <v-col cols="10">
                <v-card
                  class="pa-0"
                  tile
                  dark
                  style="background-color: transparent"
                >
                  <header
                    class="text-sm-left"
                    v-bind:class="enableCriteriaLayer_2 ? '' : 'disabled'"
                    style="font-weight: bold"
                  >
                    {{ layerChoice_2 }}
                  </header>
                  <p style="float: left; font-size: 11px">
                    {{ getScenarioDescriptionFor(layerChoice_2) }}
                  </p>
                </v-card>
              </v-col>
              <v-col cols="2">
                <v-icon
                  v-if="!enableCriteriaLayer_2"
                  color="grey"
                  @click="enableCriteriaLayer_2 = !enableCriteriaLayer_2"
                  :disabled="resultLoading"
                  >mdi-eye-off</v-icon
                >
                <v-icon
                  v-if="enableCriteriaLayer_2"
                  color="white"
                  @click="enableCriteriaLayer_2 = !enableCriteriaLayer_2"
                  >mdi-eye</v-icon
                >
              </v-col>
            </v-row>
            <!-- criteria 2 - select -->
            <v-row no-gutters align="start">
              <v-select
                :disabled="!enableCriteriaLayer_2"
                :items="criteriaOptions_2"
                v-model="criteriaChoice_2"
                @change="inputChanged()"
                item-text="label"
                item-value="label"
                :label="criteriaChoice_2.label"
                solo
                persistent-hint
                return-object
                single-line
                dark
                hide-details
              ></v-select>
            </v-row>
            <!-- criteria 2 - preset select -->
            <v-row no-gutters align="start">
              <v-select
                :disabled="!enableCriteriaLayer_2"
                :items="Object.keys(presetOptions)"
                v-model="preset_2"
                @change="
                  inputChanged();
                  sliderValues_2 = getValueForPreset(
                    preset_2,
                    criteriaChoice_2.range
                  );
                "
                item-text="label"
                item-value="label"
                solo
                persistent-hint
                return-object
                single-line
                dark
                :hint="`${criteriaChoice_2.unit}` || ''"
              ></v-select>
              <!-- criteria 2 - slider -->
              <v-row no-gutters align="center">
                <v-col style="margin-top: -35px">
                  <v-range-slider
                    :disabled="
                      !enableCriteriaLayer_2 || this.preset_2 !== 'Custom'
                    "
                    @dragstart="(_) => null"
                    @dragend="(_) => null"
                    @mousedown.native.stop="(_) => null"
                    @mousemove.native.stop="(_) => null"
                    @change="inputChanged()"
                    v-model="sliderValues_2"
                    :step="criteriaChoice_2.step"
                    :hint="
                      'Subselection has ' +
                      criteriaLayer_2.features.length +
                      ' features'
                    "
                    persistent-hint
                    thumb-label="always"
                    label=""
                    thumb-size="1"
                    tick-size="50"
                    :min="criteriaChoice_2.range[0]"
                    :max="criteriaChoice_2.range[1]"
                    dark
                    flat
                  ></v-range-slider>
                </v-col>
              </v-row>
            </v-row>
            <v-row align="center" class="mt-8">
              <p v-if="showError" class="warning">Invalid selection</p>
              <p v-if="emptyDataWarning" class="warning">No data to show!</p>
              <v-btn
                @click="showCombinedLayers"
                class="confirm_btn"
                :class="{ changesMade: resultOutdated }"
                :disabled="emptyDataWarning || showError || resultLoading"
              >
                Visualize Selection
              </v-btn>
            </v-row>
          </div>
          <!-- v-if="allDataProvided" end -->
        </v-container>
      </div>
    </div>
    <!--component_content end-->
  </div>
  <!--division end-->
</template>

<style scoped lang="scss">
@import "@/style.main.scss";
p.warning {
  color: darkred;
  margin: auto;
}

h2.disabled {
  color: gray !important;
}
</style>
