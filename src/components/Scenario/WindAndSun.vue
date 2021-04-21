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
            savedScenario: {},
            resultOutdated: true,
            showError: false
        }
    },
  computed: {
      //...mapState('scenario', ['resultLoading']), // getter only

      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
        ['windScenarioHash', 'scenario/' + 'windScenarioHash'],  // todo wind store
        ['resultLoading', 'scenario/' + 'resultLoading'],  // todo manage stores
      ])
    },
    watch: {
      windSpeed(newVal, old) {
        console.log("wind speed changed")
        console.log(newVal)
        this.resultOutdated = this.isResultOutdated()
        console.log("is outdated?", this.isResultOutdated())
        console.log("saved scen", this.savedScenario)

      },
      windDirection(newVal, old) {
        console.log("wind direction changed")
        console.log(newVal)
        this.resultOutdated = this.isResultOutdated()
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
          return this.windSpeed !== this.savedScenario["wind_speed"]
            || this.windDirection !== this.savedScenario["wind_direction"];
        },
        // prop path is the path to the property inside the file that shall be updated. in this case the scenario description
        // for our scenario name "scenario_1"
        confirmWindScenario() {
          const fileName = "wind_scenario"
          const propPath = ["scenario_1"]
          this.savedScenario = {
            "wind_speed": this.windSpeed,
            "wind_direction": this.windDirection,
            "result_format": "geojson",
            "custom_roi": []
          }
          this.windScenarioHash = hash(this.savedScenario)  // todo use store variable
          this.savedScenario["hash"] = this.windScenarioHash
          console.log(hash)
          console.log("saved scenari", this.savedScenario)

          this.$store.state.cityPyO.addLayerData(fileName, propPath, this.savedScenario).then(() => this.getWindResults())
        },
        async getWindResults() {
          this.resultLoading = true
          this.$store.dispatch('removeSourceFromMap', "wind",  {root: true})
          this.$store.commit('scenario/windResultGeoJson', null)
          this.$store.dispatch("scenario/updateWindLayer").then(() => {
            this.$store.commit("scenario/windLayer", true);
            this.resultLoading = false
          }).catch(() => {
            this.$store.commit("scenario/windLayer", false);
            this.resultLoading = false
            this.showError = true
          })
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
        <v-btn style="margin-top: 15px"
          @click="loadStaticResult('sun')"
          class="confirm_btn"
        >
          Load Sun Exposure Results
        </v-btn>
        <v-btn style="margin-top: 15px"
          @click="loadStaticResult('solar')"
          class="confirm_btn"
        >
          Load Solar Radiation Results
        </v-btn>
        <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear style="margin-top: 50px;">...</v-progress-linear>
      </v-overlay>
      <div class="disclaimer">
        <h2>Disclaimer</h2>
        <p>Results provided by InfraredCity @ AIT</p>
      </div>
      </div> <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
