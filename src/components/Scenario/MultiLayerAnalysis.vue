<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import {showMultiLayerAnalysis} from "@/store/scenario/multiLayerAnalysis";

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
            availableResultLayers: [
              // TODO adjust ranges for amenity stats!
              {"label": 'Noise Levels', "value": "Noise Levels", "unit": "dB", "range": [45,85], "step": 1},
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
      selectValue_1:{
        deep: true,
        handler(){
          if(this.selectValue_1.label === this.selectValue_2.label){
              this.showError = true
          } else {
            this.sliderValues_1 = this.selectValue_1.range
          }
        }
      },
      selectValue_2:{
        deep: true,
        handler(){
          if(this.selectValue_1.label === this.selectValue_2.label){
            this.showError = true
          } else {
            this.sliderValues_2 = this.selectValue_2.range
          }
        }
      },
      traffic_percent(newVal, old) {
        this.loadNoiseMap()
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
         const request = {
           "layer_1_Name" : this.selectValue_1.value,
           "layer_1_Range" : this.selectValue_1.range,
           "layer_1_Constraints" : this.sliderValues_1,
           "layer_2_Name" : this.selectValue_2.value,
           "layer_2_Range" : this.selectValue_2.range,
           "layer_2_Constraints" : this.sliderValues_2,
           "logicOperator" : "and"
         }

          showMultiLayerAnalysis(request)
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
                v-model="sliderValues_1"
                :step="selectValue_1.step"
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
                v-model="sliderValues_2"
                :step="selectValue_2.step"
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
        </v-container>
      <!-- old <v-btn @click="showNoiseToggle" class="confirm_btn" v-if="showNoise">
       Hide Noise Result
      </v-btn>-->
      <v-btn @click="visualizeSelection" class="confirm_btn">
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
</style>
