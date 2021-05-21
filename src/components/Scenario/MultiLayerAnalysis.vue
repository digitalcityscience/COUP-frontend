<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import {filterAndScaleLayerData, showMultiLayerAnalysis} from "@/store/scenario/multiLayerAnalysis";
import SubSelectionLayerConfig from "@/config/layerSubSelection.json";
import mdiInformationPng from '@/assets/mdi-information.png';
import CombinedLayersConfig from  "@/config/multiLayerAnalysis.json";
import PerformanceInfoLayerConfig from  "@/config/performanceInfos.json";

export default {
    name: 'MultiLayerAnalysis',
    components: {},
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            showError: false,
            allDataProvided: false,
            missingInputScenarios: [],
            showMissingScenarios: false,
            layersReadyToCompare: [],
            topic_1: null,
            topic_2: null,
            availableResultIndexes: [],
            indexChoice_1: null,
            indexChoice_2: null,
            sliderValues_1: [],
            sliderValues_2: [],
            preset_1: 'high',
            preset_2: 'high',
            showSubSelection_1: false,
            showSubSelection_2: false,
            subSelectionLayer_1: null,
            subSelectionLayer_2: null,
            emptyDataWarning: false,
            resultOutdated: false,
            resultIndexOptions: [
              // TODO adjust ranges for amenity stats!??
              // add corresponding result file source in multiLayerAnalysis.ts  -> layerLookup()
              {"layerName": "Noise", "label": 'Traffic Noise', "value": "noise", "unit": "dB", "range": [45,80], "step": 5},
              {"layerName": "Abm", "label": 'Pedestrian Density', "value": "pedestrianDensity", "unit": "pedestrians/m²", "range": [0,0.3], "step": 0.01},
              {"layerName": "Abm", "label": 'Amenity Types', "value": "Amenity Types", "unit": "unique place types", "range": [0, 20], "step": 1},
              {"layerName": "Abm", "label": 'Amenity Density', "value": "Density", "unit": "places/km²", "range": [0,850], "step": 1},
              {"layerName": "Wind", "label": 'Wind Speed', "value": "wind", "unit": "Lawson Criteria", "range": [0,1], "step": 0.2},
              {"layerName": "Sun", "label": 'Sun Exposure', "value": "sun", "unit": "h/day", "range": [0,1], "step": 0.1},
            ],
            index_Options_1: [],
            index_Options_2: [],
            logicOptions: [
              {"label": "AND", "value": "and"},
              {"label": "AND NOT", "value": "and_not"},
            ],
            logicOperator: null,
            resultLookups: {}
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading']), // getter only
      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
      ['activeMenuComponent', 'activeMenuComponent'],
      ['visibleLayers', 'visibleLayers'],
      ['traffic_percent', 'scenario/noiseScenario/' + noiseSettingsNames.traffic_percent],
      ['max_speed', 'scenario/noiseScenario/' + noiseSettingsNames.max_speed],
    ]),
    currentAbmResult(){
      return this.$store.state.scenario.activeAbmSet;
    },
    currentNoiseResult(){
      return this.$store.state.scenario.currentNoiseGeoJson;
    },
    currentWindResult(){
      return this.$store.state.scenario.windResultGeoJson;
    },
    currentSunResult(){
      return this.$store.state.scenario.sunExposureGeoJson;
    },
    },
    watch: {
      topic_1(newVal, oldVal) {
        // index for topic
        // update options for selectable indexes (to be combined to new layer)
        console.warn("topic 1 changed")

        this.index_Options_1 = this.availableResultIndexes.filter(option => {
          return option.layerName === this.topic_1
        })
        this.index_Options_2 = this.availableResultIndexes.filter(option => {
          return option.layerName === this.topic_2
        })

        this.indexChoice_1 = this.index_Options_1[0]
        this.sliderValues_1 = this.indexChoice_1.range

        this.indexChoice_2 = this.index_Options_2[0]
        this.sliderValues_2 = this.indexChoice_2.range

      },
      topic_2(newVal, oldVal) {
        // todo reset indexChoices

      },


      sliderValues_1: {
        deep: true,
        handler() {
          const request = {
            "layerName": this.indexChoice_1.value,
            "layerRange": this.indexChoice_1.range,
            "layerConstraints": this.sliderValues_1,
          }
          this.subSelectionLayer_1 = filterAndScaleLayerData(request)
          this.emptyDataWarning = this.subSelectionLayer_1.features.length === 0;
          if (this.showSubSelection_1) {
            this.$store.dispatch("scenario/addSubSelectionLayer", this.subSelectionLayer_1.features)
          }
        }
      },
      sliderValues_2: {
        deep: true,
        handler() {
          const request = {
            "layerName": this.indexChoice_2.value,
            "layerRange": this.indexChoice_2.range,
            "layerConstraints": this.sliderValues_2,
          }
          this.subSelectionLayer_2 = filterAndScaleLayerData(request)
          this.emptyDataWarning = this.subSelectionLayer_2.features.length === 0;
          if (this.showSubSelection_2) {
            this.$store.dispatch("scenario/addSubSelectionLayer", this.subSelectionLayer_2.features)
          }
        }
      },
      indexChoice_1: {
        deep: true,
        handler() {
          console.warn("indexChoice_1 changed", this.indexChoice_1)
          this.showSubSelection_1 = false
          if (this.indexChoice_1.label === this.indexChoice_2.label) {
            this.showError = true
          } else {
            this.sliderValues_1 = this.indexChoice_1.range
            const request = {
              "layerName": this.indexChoice_1.value,
              "layerRange": this.indexChoice_1.range,
              "layerConstraints": this.sliderValues_1,
            }
            this.subSelectionLayer_1 = filterAndScaleLayerData(request)
          }
        }
      },
      indexChoice_2: {
        deep: true,
        handler() {
          this.showSubSelection_2 = false
          if (this.indexChoice_1.label === this.indexChoice_2.label) {
            this.showError = true
          } else {
            this.sliderValues_2 = this.indexChoice_2.range
            const request = {
              "layerName": this.indexChoice_2.value,
              "layerRange": this.indexChoice_2.range,
              "layerConstraints": this.sliderValues_2,
            }
            this.subSelectionLayer_2 = filterAndScaleLayerData(request)
          }
        }
      },
      showSubSelection_1(newVal, old) {
        if (newVal) {
          if (this.showSubSelection_2) {
            this.showSubSelection_2 = false
          }
          this.$store.dispatch("scenario/addSubSelectionLayer", this.subSelectionLayer_1.features)
          this.$store.dispatch("hideAllLayersButThese",[SubSelectionLayerConfig.layer.id])
        } else {
          // hide subSelectionLayer, if subSelection is not to be shown
          if (!this.showSubSelection_2) {
            this.$store.state.map?.setLayoutProperty(SubSelectionLayerConfig.layer.id, 'visibility', 'none');
          }
        }
      },
      showSubSelection_2(newVal, old) {
        if (newVal) {
          if (this.showSubSelection_1) {
            this.showSubSelection_1 = false
          }
          this.$store.dispatch("scenario/addSubSelectionLayer", this.subSelectionLayer_2.features)
          this.$store.dispatch("hideAllLayersButThese",[SubSelectionLayerConfig.layer.id])
        } else {
          // hide subSelectionLayer, if subSelection is not to be shown
          if (!this.showSubSelection_1) {
            this.$store.state.map?.setLayoutProperty(SubSelectionLayerConfig.layer.id, 'visibility', 'none');
          }
        }
      }
    },
    async beforeMount() {
      this.determineMissingScenarios()

      // add image to map if necessary . For result annotation layer.
      if (! $store.state.map.hasImage("mdi-information")) {
        const map = this.$store.state.map
        map.loadImage(
          mdiInformationPng,
          function (error, image) {
            if (error) throw error;
            map.addImage('mdi-information', image);
          }
        )
      }
    },
    mounted:
        function() {

          // calc input statistics, if all scenarios chosen
          if (this.currentAbmResult) {
            this.calculateStats()
          }

          // hide all layers
          this.$store.dispatch('hideAllLayersButThese')

          /*autogenerationg Sub Menu for all divs of Class "division"*/
          var divisions = document.getElementsByClassName("division");
          for (var i = 0; i < divisions.length; i++) {
              let divInstance = {
                  title: divisions[i].getAttribute('data-title'),
                  pic: divisions[i].getAttribute('data-pic'),
              };
              this.componentDivisions.push(divInstance);
          }

          this.activeDivision = divisions[0].getAttribute('data-title');
          console.log("active divisoin is", this.activeDivision)
        },
    methods: {
      determineMissingScenarios() {

        console.warn("determine missing scenarios")

        const scenarioResults = {
          "Noise": this.currentNoiseResult,
          "Abm": this.currentAbmResult,
          "Wind": this.currentWindResult,
          "Sun": this.currentSunResult
        }

        // iterate over scenario results, if a result is empty add the topic to missing Input scenarios
        this.missingInputScenarios = []
        this.layersReadyToCompare = []
        for (const [key, value] of Object.entries(scenarioResults)) {
          if (!value) {
            this.missingInputScenarios.push(key)
          } else {
            this.layersReadyToCompare.push(key)
          }
        }

        console.warn("missing these scenarios", this.missingInputScenarios)
        console.warn("scenarios ready to compare", this.layersReadyToCompare)
        this.updateCombinationMenu()
      },
      async loadDefault(layerName) {
        console.warn("loading default for", layerName)

        switch(layerName) {
          case "Sun":
            await this.$store.dispatch('scenario/addSunExposureLayer')
            break;
          case "Wind":
            await this.$store.dispatch('scenario/updateWindLayer')
            break;
          case "Noise":
            await this.$store.dispatch('scenario/updateNoiseScenario')
            break;
          case "Abm":
            await this.$store.dispatch('scenario/updateAbmDesignScenario')
            this.determineMissingScenarios()
            this.$store.dispatch('hideAllLayersButThese')
            this.calculateStats()
            break;
          default:
          console.error("cannot load default result for unknown layer", layerName)
        }
        // then update missing scenarios and hide result layers
        this.determineMissingScenarios()
        this.$store.dispatch('hideAllLayersButThese')
      },
      switchToAbm() {
        this.activeMenuComponent = 'AbmScenario'
      },
      switchToNoise() {
        this.activeMenuComponent = 'NoiseScenario'
      },
      async calculateStats() {
        // todo only for ABM!
        this.$store.dispatch('scenario/calculateStatsForMultiLayerAnalysis').then(() => {
          this.allDataProvided = true
        })
      },
      updateCombinationMenu() {
        // check if at least to layers are available for analysis
        if (!(this.layersReadyToCompare.length >= 2)) {
          console.warn("need at least 2 input layers to combine")
          return
        }

        console.warn("updating menu now", this.layersReadyToCompare.length)

        // filter layer options for actually available layers
        this.availableResultIndexes = this.resultIndexOptions.filter(option => {
          return this.missingInputScenarios.indexOf(option.layerName) === -1
        })

        // set initial UI settings if not set yet
        if (!this.topic_1) {

          // topic
          this.topic_1 = this.layersReadyToCompare[0]
          this.topic_2 = this.layersReadyToCompare[1]

          console.warn("topics", this.topic_1, this.topic_2)
          console.warn("this result indexes are available", this.availableResultIndexes)

          this.logicOperator = this.logicOptions[0]
        }
      },
      inputChanged() {
        this.resultOutdated = true;
        this.showError = false;
      },
     async showCombinedLayers () {
         this.$store.commit('scenario/resultLoading', true)
         this.$store.commit("scenario/loader", true);
         this.$store.commit("scenario/loaderTxt", "Combining Layers");
         await new Promise(resolve => setTimeout(resolve, 500));

        this.resultOutdated = false
        const combinedLayers = showMultiLayerAnalysis(
          this.subSelectionLayer_1,
          this.subSelectionLayer_2,
          this.logicOperator.value
        );

        if (combinedLayers.length === 0) {
          this.emptyDataWarning = true
        } else {
          this.$store.commit("scenario/multiLayerAnalysisMap", true);
        }
        this.$store.commit('scenario/resultLoading', false)
        this.$store.commit("scenario/loader", false);
        this.$store.dispatch("hideAllLayersButThese",[
          CombinedLayersConfig.layer.id,
          PerformanceInfoLayerConfig.layer.id
        ])
     }
    }
}


</script>

<template>
  <div id="scenario" ref="scenario">
    <div class="component_divisions">
      <ul>
        <!-- This will create a menu item from each div of class "division" (scroll down for example) -->
        <li v-for="division in componentDivisions" :key="division.title" v-bind:class="{ highlight: activeDivision === division.title }">
          <div class="component_link" @click="activeDivision = division.title">
            <v-icon>{{division.pic}}</v-icon>
          </div>
          <div class="toHover">{{division.title}}</div>
        </li>
      </ul>
    </div>

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Scenario'" class="component_content">
      <div class="scenario_box">
        <!-- Choose Layers to combine -->

        <h2>LAYER SELECTION</h2>
        <v-container fluid>
          <!-- per row: check button. AND/OR selector. slider per v-select -->
          <!-- set slider min max dynamically -->
          <div v-if="layersReadyToCompare.length >= 2">
            <v-row align="center">
                <v-select
                  :items="layersReadyToCompare"
                  v-model="topic_1"
                  @change="inputChanged()"
                  item-text="label"
                  item-value="label"
                  solo
                  persistent-hint
                  return-object
                  single-line
                  dark
                ></v-select>
            </v-row>
            <v-row>
                <v-select
                  :items="layersReadyToCompare"
                  v-model="topic_2"
                  @change="inputChanged()"
                  item-text="label"
                  item-value="label"
                  solo
                  persistent-hint
                  return-object
                  single-line
                  dark
                ></v-select>
            </v-row>
          </div>
        <!-- Layers not available?? Load defaults! -->
        <div v-if="missingInputScenarios.length">
          <v-row class="mb-2">
            <v-col cols="10">
              <v-card
                class="pa-0"
                tile
                dark
                style="background-color: transparent; margin-top: 5px;"
              >
                <h2>Layer Not Available?</h2>
              </v-card>
            </v-col>
            <v-col cols="2">
                <v-icon v-if="!showMissingScenarios" size="10" color="white" @click="showMissingScenarios = !showMissingScenarios">mdi-triangle mdi-rotate-270</v-icon>
                <v-icon v-if="showMissingScenarios" size="10" color="white" @click="showMissingScenarios = !showMissingScenarios">mdi-triangle mdi-rotate-180</v-icon>
            </v-col>
          </v-row>
          <!-- Legend categories as v-for -->
          <v-row v-if="showMissingScenarios" no-gutters
                 v-for="layerName in missingInputScenarios"
                 class="mb-2 ml-0"
                 style=""
          >
            <v-col cols="2" xs="3">
              <v-card
                class="mr-2"
                tile
                dark
                style=""
              >
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
                  @click="loadDefault(layerName)"
                  class="confirm_btn"
                  :class="{ changesMade : resultOutdated }"
                  :disabled="resultLoading || showError"
                  style="min-width: 100%;"
                >Load Default
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
      </div>


      <!-- Criteria Selection --->
      <div v-if="layersReadyToCompare.length >= 2" class="scenario_box">
        <h2>CRITERIA SELECTION</h2>

        <v-container>
        <v-row class="mb-2">
          <v-col cols="10">
            <v-card
              class="pa-0"
              tile
              dark
              style="background-color: transparent; margin-top: 5px;"
            >
              <h2>{{ topic_1 }}</h2>
            </v-card>
          </v-col>
          <v-col cols="2">
            <v-icon v-if="!showSubSelection_1" color="white" @click="showSubSelection_1 = !showSubSelection_1">mdi-eye</v-icon>
            <v-icon v-if="showSubSelection_1" color="white" @click="showSubSelection_1 = !showSubSelection_1">mdi-eye-off</v-icon>
          </v-col>
        </v-row>
        <v-row align="center">
          <v-select
            :items="index_Options_1"
            v-model="indexChoice_1"
            @change="inputChanged()"
            item-text="label"
            item-value="label"
            :hint="`${indexChoice_1.unit}` || ''"
            :label="indexChoice_1.label"
            solo
            persistent-hint
            return-object
            single-line
            dark
          ></v-select>
        </v-row>
        <v-row align="center">
          <v-col style="margin-top: -25px">
            <v-range-slider
              @dragstart="_ => null"
              @dragend="_ => null"
              @mousedown.native.stop="_ => null"
              @mousemove.native.stop="_ => null"
              @change="inputChanged()"
              v-model="sliderValues_1"
              :step="indexChoice_1.step"
              :hint="'Subselection has ' + subSelectionLayer_1.features.length + ' features'"
              label=""
              persistent-hint
              thumb-label="always"
              thumb-size="1"
              tick-size="50"
              :min="indexChoice_1.range[0]"
              :max="indexChoice_1.range[1]"
              dark
              flat
            ></v-range-slider>
          </v-col>
        </v-row>


          <v-row class="mb-2">
            <v-col cols="10">
              <v-card
                class="pa-0"
                tile
                dark
                style="background-color: transparent; margin-top: 5px;"
              >
                <h2>{{ topic_2 }}</h2>
              </v-card>
            </v-col>
            <v-col cols="2">
              <v-icon v-if="!showSubSelection_2" color="white" @click="showSubSelection_2 = !showSubSelection_2">mdi-eye</v-icon>
              <v-icon v-if="showSubSelection_2" color="white" @click="showSubSelection_2 = !showSubSelection_2">mdi-eye-off</v-icon>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col style="margin-top: -25px;">
              <v-range-slider
                @dragstart="_ => null"
                @dragend="_ => null"
                @mousedown.native.stop="_ => null"
                @mousemove.native.stop="_ => null"
                @change="inputChanged()"
                v-model="sliderValues_2"
                :step="indexChoice_2.step"
                :hint="'Subselection has ' + subSelectionLayer_2.features.length + ' features'"
                persistent-hint
                thumb-label="always"
                label=""
                thumb-size="1"
                tick-size="50"
                :min="indexChoice_2.range[0]"
                :max="indexChoice_2.range[1]"
                dark
                flat
              ></v-range-slider>
            </v-col>
          </v-row>




          <!-- exclude logic options for now - too complicated
          <v-row align="center">
            <v-select
              :items="logicOptions"
              v-model="logicOperator"
              @change="inputChanged()"
              item-text="label"
              item-value="label"
              hint="Combine layers by"
              solo
              label="Logic Layer Connection"
              persistent-hint
              return-object
              single-line
              dark
            ></v-select>
          </v-row>
          -->
          <p v-if="showError" class="warning">Invalid selection</p>
          <p v-if="emptyDataWarning" class="warning">No data to show!</p>
          <v-btn
            @click="showCombinedLayers"
            class="confirm_btn"
            :class="{ changesMade : resultOutdated }"
            :disabled="emptyDataWarning || showError"
          >
           Visualize Selection
          </v-btn>
        </v-container>
        </div> <!-- v-if="allDataProvided" end -->


        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear>...</v-progress-linear>
        </v-overlay>
      </div>  <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
    p.warning {
      color: darkred;
    }



</style>
