<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import hash from 'object-hash'

export default {
    name: 'WindScenario',
    components: {},
    props: {
      restrictedAccess: Boolean
    },
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            windSpeed: 10,
            windDirection: 240,
            currentScenario: {},
            resultOutdated: true,
            showError: false,
            scenarioAlreadySaved: false
        }
    },
  computed: {
      //...mapState('scenario', ['resultLoading']), // getter only

      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
        ['windScenarioHash', 'scenario/' + 'windScenarioHash'],  // todo wind store
        ['resultLoading', 'scenario/' + 'resultLoading'],  // todo manage stores
        ['savedWindScenarios', 'scenario/' + 'savedWindScenarios'],  // todo manage stores
      ])
    },
    watch: {
      windSpeed(newVal, old) {
        console.log("wind speed changed")
        console.log(newVal)
        this.resultOutdated = this.isResultOutdated()
        this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
        console.log("is outdated?", this.isResultOutdated())
        console.log("saved scen", this.currentScenario)

      },
      windDirection(newVal, old) {
        console.log("wind direction changed")
        console.log(newVal)
        this.resultOutdated = this.isResultOutdated()
        this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
      }
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
        isResultOutdated() {
          return this.windSpeed !== this.currentScenario["wind_speed"]
            || this.windDirection !== this.currentScenario["wind_direction"];
        },
        // prop path is the path to the property inside the file that shall be updated. in this case the scenario description
        // for our scenario name "scenario_1"
        confirmWindScenario() {
          const fileName = "wind_scenario"
          const propPath = ["scenario_1"]
          this.currentScenario = {
            "wind_speed": this.windSpeed,
            "wind_direction": this.windDirection,
            "result_format": "geojson",
            "custom_roi": []
          }
          this.windScenarioHash = hash(this.currentScenario)  // todo use store variable
          this.currentScenario["hash"] = this.windScenarioHash
          console.log(hash)
          console.log("saved scenari", this.currentScenario)

          // update scenario add cityPyo
          this.$store.state.cityPyO.addLayerData(fileName, propPath, this.currentScenario).then(() => this.getWindResults())
        },
        async getWindResults() {
          this.resultLoading = true
          this.$store.dispatch('removeSourceFromMap', "wind",  {root: true})
          this.$store.commit('scenario/windResultGeoJson', null)
          this.$store.dispatch("scenario/updateWindLayer").then(() => {
            // success
            this.$store.commit("scenario/windLayer", true);
            this.resultLoading = false
            this.resultOutdated = this.isResultOutdated()
            this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
          }).catch(() => {
            // fail
            this.$store.commit("scenario/windLayer", false);
            this.resultLoading = false
            this.showError = true
          })
        },
      loadSavedScenario(savedScenario) {
          this.windDirection = savedScenario["wind_direction"]
          this.windSpeed = savedScenario["wind_speed"]
          this.confirmWindScenario()
      },
      saveWindScenario() {
          console.log("saved scenarios", this.savedWindScenarios)
          if (!this.scenarioAlreadySaved) {
            // add current scenario to saved scenarios
            this.savedWindScenarios.push(this.currentScenario)
            if (this.savedWindScenarios.length > 3) {
              // store only the 3 latest saved scenarios
              this.savedWindScenarios.shift()
            }
          }
          // update scenarioAlreadySaved variable
          this.scenarioAlreadySaved = this.isScenarioAlreadySaved()
          console.log(this.savedWindScenarios)
      },
      isScenarioAlreadySaved() {
          const isSaved = this.savedWindScenarios.filter(savedScen => {
              return JSON.stringify(savedScen) === JSON.stringify(this.currentScenario)
          }
          ).length > 0

        console.log("is saved", isSaved)
        return isSaved
      },
      async loadStaticResult(resultType) {
        if (resultType === "sun") {
          this.$store.dispatch('scenario/addSunExposureLayer').then(() => {
            this.$store.commit("scenario/sunExposureLayer", true);
          })
        }
        if (resultType === "solar") {
          this.$store.dispatch('scenario/addSolarRadiationLayer').then(() => {
            this.$store.commit("scenario/solarRadiationLayer", true);
          })
        }
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
        <h2>Choose Wind Scenario</h2>
        <v-container fluid>
          <header class="text-sm-left">
            Wind Direction</header>
          <p dark style="float:left;">{{ windDirection }}°</p>
          <v-slider
            v-model="windDirection"
            step=15
            thumb-label="always"
            thumb-size="25"
            ticks="always"
            tick-size="4"
            :tick-labels="['North', '', '', '', '', '', 'East', '', '', '', '', '', 'South', '', '', '', '', '', 'West', '', '', '', '', '', 'North']"
            min="0"
            max="360"
            dark
            flat
          ></v-slider>
          <header class="text-sm-left">
            Wind Speed</header>
          <p dark style="float:left;">{{ windSpeed }} km/h</p>
          <v-slider
            v-model="windSpeed"
            step=5
            thumb-label="always"
            thumb-size="25"
            ticks="always"
            tick-size="4"
            :tick-labels="['0', '', '', '', '20km/h', '', '', '', '40km/h', '', '', '', '60km/h', '', '', '', '80']"
            min="0"
            max="80"
            dark
            flat
          ></v-slider>
      </v-container>
        <p v-if="showError" class="warning">Wind server not available at the moment</p>
        <v-btn
          @click="confirmWindScenario"
          class="confirm_btn"
          :class="{ changesMade : resultOutdated }"
          :disabled="resultLoading || showError"
        >
          Load Wind Results
        </v-btn>
        <v-btn style="margin-top: 1vh;"
          @click="saveWindScenario"
          class="confirm_btn"
          :disabled="resultOutdated || scenarioAlreadySaved"
          :dark="resultOutdated  || scenarioAlreadySaved"
        >
          Save this wind scenario
        </v-btn>
        <v-btn style="margin-top: 1vh;"
          @click="loadStaticResult('sun')"
          class="confirm_btn"
        >
          Load Sun Exposure Results
        </v-btn>
        <v-btn style="margin-top: 1vh;"
          @click="loadStaticResult('solar')"
          class="confirm_btn"
        >
          Load Solar Radiation Results
        </v-btn>
        <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear style="margin-top: 50px;">...</v-progress-linear>
        </v-overlay>
        <div class="saved_scenarios" style="margin-top: 3vh;">
          <h2>Reload a saved scenario</h2>
          <v-data-iterator
            :items="savedWindScenarios"
            :hide-default-footer="true"
          >
            <template v-slot:default="{ items }">
              {{/* Use the items to iterate */}}
              <v-flex v-for="(scenario, index) in items" :key="index">
                <v-btn v-if="index <= 2" style="margin-top: 1vh;"
                  @click="loadSavedScenario(scenario)"
                  class="confirm_btn"
                > Direction: {{ scenario.wind_direction }} | Speed: {{ scenario.wind_speed }}
                </v-btn>
              </v-flex>
            </template>
          </v-data-iterator>
        </div>


      <div class="disclaimer">
        <h2>Disclaimer</h2>
        <p>Results provided by InfraredCity @ AIT <br>
        The model was trained on the solar characteristics of Vienna, AT</p>
      </div>
      </div> <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
