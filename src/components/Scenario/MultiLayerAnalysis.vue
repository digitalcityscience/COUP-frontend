<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import {filterAndScaleLayerData, showMultiLayerAnalysis} from "@/store/scenario/multiLayerAnalysis";
import SubSelectionLayerConfig from "@/config/layerSubSelection.json";


export default {
    name: 'MultiLayerAnalysis',
    components: {},
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            showError: false,
            selectValue_1: null,
            selectValue_2: null,
            sliderValues_1: [],
            sliderValues_2: [],
            showSubSelection_1: false,
            showSubSelection_2: false,
            subSelectionLayer_1: null,
            subSelectionLayer_2: null,
            emptyDataWarning: false,
            resultOutdated: false,
            availableResultLayers: [
              // TODO adjust ranges for amenity stats!
              {"label": 'Noise Levels', "value": "Noise Levels", "unit": "dB", "range": [45,85], "step": 5},
              {"label": 'Amenity Types', "value": "Amenity Types", "unit": "unique place types", "range": [0, 20], "step": 1},
              {"label": 'Complementarity', "value": "Complementarity", "unit": "complementary trips count", "range": [0,100], "step": 1},
              {"label": 'Density', "value": "Density", "unit": "places/km²", "range": [0,100], "step": 1},
              {"label": 'Diversity', "value": "Diversity", "unit": "Simpson Index", "range": [0,100], "step": 1},
              {"label": 'Opportunities for Interaction', "value": "opportunitiesOfInteraction", "unit": "interactions/m²", "range": [0,0.15], "step": 0.01},
              {"label": 'Pedestrian Density', "value": "pedestrianDensity", "unit": "pedestrians/m²", "range": [0,0.3], "step": 0.01},
              {"label": 'Temporal Entropy', "value": "temporalEntropyPercent", "unit": "%", "range": [0,100], "step": 1},
              {"label": 'Trip Duration', "value": "averageDuration", "unit": "minutes", "range": [0, 60], "step": 1},
              {"label": 'Trip Length', "value": "averageLength", "unit": "meters", "range": [0,150], "step": 1},
            ],
            select_Options_1: [],
            select_Options_2: [],
            resultLookups: {}
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading']), // getter only
      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
      ['showNoise', 'scenario/' + 'showNoise'],
      ['traffic_percent', 'scenario/noiseScenario/' + noiseSettingsNames.traffic_percent],
      ['max_speed', 'scenario/noiseScenario/' + noiseSettingsNames.max_speed],
    ])
    },
    watch: {
      sliderValues_1: {
        deep: true,
        handler() {
          const request = {
            "layerName": this.selectValue_1.value,
            "layerRange": this.selectValue_1.range,
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
            "layerName": this.selectValue_2.value,
            "layerRange": this.selectValue_2.range,
            "layerConstraints": this.sliderValues_2,
          }
          this.subSelectionLayer_2 = filterAndScaleLayerData(request)
          this.emptyDataWarning = this.subSelectionLayer_2.features.length === 0;
          if (this.showSubSelection_2) {
            this.$store.dispatch("scenario/addSubSelectionLayer", this.subSelectionLayer_2.features)
          }
        }
      },
      selectValue_1: {
        deep: true,
        handler() {
          this.showSubSelection_1 = false
          if (this.selectValue_1.label === this.selectValue_2.label) {
            this.showError = true
          } else {
            this.sliderValues_1 = this.selectValue_1.range
            const request = {
              "layerName": this.selectValue_1.value,
              "layerRange": this.selectValue_1.range,
              "layerConstraints": this.sliderValues_1,
            }
            this.subSelectionLayer_1 = filterAndScaleLayerData(request)
          }
        }
      },
      selectValue_2: {
        deep: true,
        handler() {
          this.showSubSelection_2 = false
          if (this.selectValue_1.label === this.selectValue_2.label) {
            this.showError = true
          } else {
            this.sliderValues_2 = this.selectValue_2.range
            const request = {
              "layerName": this.selectValue_2.value,
              "layerRange": this.selectValue_2.range,
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
        } else {
          console.log("hiding?")
          // hide subSelectionLayer, if subSelection is not to be shown
          if (!this.showSubSelection_1) {
            this.$store.state.map?.setLayoutProperty(SubSelectionLayerConfig.layer.id, 'visibility', 'none');
          }
        }
      }
    },
    beforeMount() {
      this.select_Options_1 = this.availableResultLayers
      this.selectValue_1 = this.availableResultLayers[0]
      this.sliderValues_1 = this.selectValue_1.range

      this.select_Options_2 = this.availableResultLayers
      this.selectValue_2 = this.availableResultLayers[1]
      this.sliderValues_2 = this.selectValue_2.range

      // todo create results
      // todo create resultLookups with results from store.

    },
    mounted:
        function() {
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
        loadNoiseMap () {
            this.$store.dispatch(
                'scenario/updateNoiseScenario'
            )
        },
        visualizeSelection () {
          this.resultOutdated = false
          const combinedLayers = showMultiLayerAnalysis(this.subSelectionLayer_1, this.subSelectionLayer_2)
          if (combinedLayers.length === 0) {
            this.emptyDataWarning = true
          }

        },
      inputChanged() {
          console.log("result outdated")
          this.resultOutdated = true;
          this.showError = false;
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
        <h2>Choose Indexes</h2>
        <v-container fluid>

          <!-- per row: check button. AND/OR selector. slider per v-select -->
          <!-- set slider min max dynamically -->

          <v-row align="center">
            <v-col
              class="d-flex"
              cols="12"
              sm="6"
            >
              <v-select
                :items="select_Options_1"
                v-model="selectValue_1"
                @change="inputChanged()"
                item-text="label"
                item-value="label"
                :hint="`${selectValue_1.unit}`"
                solo
                label=""
                persistent-hint
                return-object
                single-line
                dark
              ></v-select>
            </v-col>
            <v-col
              class="d-flex"
              cols="12"
              sm="6"
            >
              <v-select
                :items="select_Options_2"
                v-model="selectValue_2"
                @change="inputChanged()"
                item-text="label"
                item-value="label"
                :hint="`${selectValue_2.unit}`"
                solo
                label=""
                persistent-hint
                return-object
                single-line
                dark
              ></v-select>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col>
              <!-- TODO SLIDER VALUE, oder mit watch auf range-->
              <v-range-slider
                @dragstart="_ => null"
                @dragend="_ => null"
                @mousedown.native.stop="_ => null"
                @mousemove.native.stop="_ => null"
                @change="inputChanged()"
                v-model="sliderValues_1"
                :step="selectValue_1.step"
                :hint="'Subselection has ' + subSelectionLayer_1.features.length + ' features'"
                persistent-hint
                thumb-label="always"
                label=""
                thumb-size="1"
                tick-size="50"
                :min="selectValue_1.range[0]"
                :max="selectValue_1.range[1]"
                dark
                flat
              ></v-range-slider>
            </v-col>
            <v-col>
              <v-range-slider
                @dragstart="_ => null"
                @dragend="_ => null"
                @mousedown.native.stop="_ => null"
                @mousemove.native.stop="_ => null"
                @change="inputChanged()"
                v-model="sliderValues_2"
                :step="selectValue_2.step"
                :hint="'Subselection has ' + subSelectionLayer_2.features.length + ' features'"
                persistent-hint
                thumb-label="always"
                label=""
                thumb-size="1"
                tick-size="50"
                :min="selectValue_2.range[0]"
                :max="selectValue_2.range[1]"
                dark
                flat
              ></v-range-slider>
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col>
              <v-checkbox
                v-model="showSubSelection_1"
                dark
                label="Show subselection">
              </v-checkbox>
            </v-col>
            <v-col>
              <v-checkbox
                v-model="showSubSelection_2"
                dark
                label="Show subselection">
              </v-checkbox>
            </v-col>
          </v-row>
        </v-container>
      <!-- old <v-btn @click="showNoiseToggle" class="confirm_btn" v-if="showNoise">
       Hide Noise Result
      </v-btn>-->
      <p v-if="showError" class="warning">Invalid selection</p>
      <p v-if="emptyDataWarning" class="warning">No data to show!</p>
      <v-btn
        @click="visualizeSelection"
        class="confirm_btn"
        :class="{ changesMade : resultOutdated }"
        :disabled="emptyDataWarning || showError"
      >
       Visualize Selection
      </v-btn>
      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear>...</v-progress-linear>
      </v-overlay>
      </div> <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
    p.warning {
      color: darkred;
    }
</style>
