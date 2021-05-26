<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import Legend from "@/components/Scenario/Legend";

export default {
    name: 'NoiseScenario',
    components: {
      Legend: Legend
    },
    props: {
      restrictedAccess: Boolean
    },
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            trafficPercent_labels: [
              '0%',
              '25%',
              '50%',
              '75%',
              "100%"
            ],
            trafficPercent: 1,
            maxSpeed: 50,
            resultOutdated: true,
            showError: false,
            scenarioAlreadySaved: false
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading']), // getter only
      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
      ['noiseMap', 'scenario/' + 'noiseMap'],
      ['noiseScenario', 'scenario/noiseScenario'],
      ['savedNoiseScenarios', 'scenario/' + 'savedNoiseScenarios'],  // todo manage stores
        //['trafficPercent', 'scenario/noiseScenario/' + noiseSettingsNames.trafficPercent],
      //['maxSpeed', 'scenario/noiseScenario/' + noiseSettingsNames.maxSpeed],
    ])
    },
    watch: {
      maxSpeed(newVal, old) {
        this.resultOutdated = this.isResultOutdated()
        this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
      },
      trafficPercent(newVal, old) {
        this.resultOutdated = this.isResultOutdated()
        this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
      }
    },
    mounted:
        function() {
          // hide all other layers
          this.$store.dispatch(
            'hideAllLayersButThese',
            ['noise', 'trafficCounts']
          )

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
       isResultOutdated() {
          return this.trafficPercent !== this.noiseScenario["traffic_percent"]
            || this.maxSpeed !== this.noiseScenario["max_speed"];
        },
        loadNoiseMap () {
            this.$store.dispatch(
                'scenario/updateNoiseScenario'
            ).then(() => {
              this.$store.commit("scenario/noiseMap", true);
            })
            this.resultOutdated = false;
        },
        loadNoiseResults () {
          this.$store.commit("scenario/noiseScenario", {
            traffic_percent: this.trafficPercent,
            max_speed: this.maxSpeed,
          });
          this.loadNoiseMap()
        },
        loadSavedScenario(savedScenario) {
          this.trafficPercent = savedScenario["traffic_percent"]
          this.maxSpeed = savedScenario["max_speed"]
          this.loadNoiseResults()
        },
        saveNoiseScenario() {
          console.log("saved scenarios", this.savedNoiseScenarios)
          if (!this.scenarioAlreadySaved) {
            // add current scenario to saved scenarios
            this.savedNoiseScenarios.push(this.noiseScenario)
          }
          // update scenarioAlreadySaved variable
          this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
          console.log(this.savedNoiseScenarios)
        },
        isScenarioAlreadySaved() {
          const isSaved = this.savedNoiseScenarios.filter(savedScen => {
              return JSON.stringify(savedScen) === JSON.stringify(this.currentScenario)
            }
          ).length > 0

          console.log("is saved", isSaved)
          return isSaved
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
      <div v-if="activeDivision === 'Scenario'" class="component_content scenario">
        <h2>Noise Scenario Settings</h2>
        <v-container fluid>
          <!-- Traffic Percentage -->
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">
              TRAFFIC VOLUME <br>
              In project area
            </header>
            <v-slider
              v-model="trafficPercent"
              step=0.25
              thumb-label="always"
              label="%"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="trafficPercent_labels"
              min="0"
              max="1"
              dark
              flat
            ></v-slider>
          </div>
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">
              SPEED LIMIT <br>
              In project area
            </header>
            <v-radio-group v-model="maxSpeed">
              <v-radio
                :value="30"
                flat
                label="30 kmh/h"
                dark
              />
              <v-radio
                :value="50"
                flat
                label="50 kmh/h"
                dark
              />
            </v-radio-group>
          </div>
          <v-btn @click="loadNoiseResults"
                 class="confirm_btn"
                 :class="{ changesMade : resultOutdated }"
                 :disabled="resultLoading || showError"
          >
            Run Scenario
          </v-btn>
          <v-btn style="margin-top: 1vh; margin-bottom: 1vh; float:right; max-width: 30px;"
                 @click="saveNoiseScenario"
                 class="confirm_btn"
                 :disabled="resultOutdated || scenarioAlreadySaved"
                 :dark="resultOutdated  || scenarioAlreadySaved"
          >
            Save
          </v-btn>
        </v-container>


        <!--saved scenarios -->
        <div class="saved_scenarios" style="margin-top: 5vh;">
          <h2>Reload a saved scenario</h2>
          <v-data-iterator
            :items="savedNoiseScenarios"
            :hide-default-footer="true"
          >
            <template v-slot:default="{ items }">
              {{/* Use the items to iterate */}}
              <v-flex v-for="(scenario, index) in items" :key="index">
                <v-btn v-if="index <= 2" style="margin: 1vh auto;"
                       @click="loadSavedScenario(scenario)"
                       outlined
                       dark
                       small>
                         <span v-if="scenario.label">
                            {{ scenario.label }}
                         </span>
                         <span v-if="!scenario.label">
                            VOLUME: {{ 100 * scenario.traffic_percent }} % | SPEED: {{ scenario.max_speed }}
                         </span>
                </v-btn>
              </v-flex>

            </template>
          </v-data-iterator>
        </div>

      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear>...</v-progress-linear>
      </v-overlay>
      </div> <!--component_content end-->
    </div><!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title='Dashboard' data-pic='mdi-view-dashboard'>
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Traffic Noise | Dashboard</h2>
        <p>To be developed</p>
      </div><!--component_content end-->
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title='info' data-pic='mdi-information-variant'>
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'info'" class="component_content">
        <h2>Traffic Noise | About</h2>
        <Legend v-bind:topic="'noise'"></Legend>

        <!-- text block with subtext blocks, fade out to end to hint for scrolling -->
        <!-- legend color same as background! -->
        <div class="info_text">
          <h4>TRAFFIC VOLUME</h4>
          <p>
          Volume of motorized traffic (cars, trucks).
          Selecting 100% shows the traffic volume
          according to current planning assumptions
          (predicted traffic volume).
          Selecting 25%, for example, shows 25% of the
            predicted traffic volume. This is concerning traffic on the Grasbrook peninsula only.</p>

          <h4>SIMULATION</h4>
          <p>
          The noise simulation is adapted from the software NoiseModelling
          (https://noise-planet.org/noisemodelling.html),
          a free and open-source tool for producing environmental noise maps using a simplified implementation of the French national method NMPB-08,
          The calculation method is almost compliant with the CNOSSOS-EU standard method for noise
          emission (only road traffic) and noise propagation.
          The software is developed by the French Institute of Science and Technology for Transport,
          Development and Networks (Ifsttar).</p>

          <h4>COLOR SCHEME</h4>
          <p>The composition of the eleven-class scheme for the presentation of noise immission, e.g. the combined use of colors that are similar to the presented colors according to visual assessment or due to their color codes, by Beate Tomio is licensed under a Creative Commons Attribution – NonCommercial – NoDerivatives 4.0 International License.
          Used with permission.
            Find out more: https://www.coloringnoise.com/</p>
        </div>

      </div><!--component_content end-->
    </div>
    <!--division end-->
  </div>
</template>


<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
