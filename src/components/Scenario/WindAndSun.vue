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
            windDirection: 180
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading', "windResultComplete"]), // getter only

      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
        ['noiseMap', 'scenario/' + 'noiseMap'],  // todo wind map
        ['windScenarioHash', 'scenario/' + 'windScenarioHash'],  // todo wind store
      ])
    },
    watch: {
      windSpeed(newVal, old) {
        console.log("wind speed changed")
        console.log(newVal)

      },
      windDirection(newVal, old) {
        console.log("wind direction changed")
        console.log(newVal)
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

        // prop path is the path to the property inside the file that shall be updated. in this case the scenario description
        // for our scenario name "scenario_1"
        sendScenarioToCityPyo() {
          const fileName = "wind_scenario"
          const propPath = ["scenario_1"]
          const payload = {
            "wind_speed": this.windSpeed,
            "wind_direction": this.windDirection,
            "result_format": "geojson",
            "custom_roi": []
          }
          this.windScenarioHash = hash(payload)  // todo use store variable
          payload["hash"] = this.windScenarioHash
          console.log(hash)

          this.$store.state.cityPyO.addLayerData(fileName, propPath, payload).then(() => this.getWindResults())
        },
        async getWindResults() {
          this.$store.dispatch('removeSourceFromMap', "wind",  {root: true})
          this.$store.commit('scenario/windResultGeoJson', null)
          this.$store.dispatch("scenario/updateWindLayer") //.then(isResultComplete => {
            /*if (!isResultComplete) {
              new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
                console.log("calling again until result complete")
                this.getWindResults()
              })
            }
          })*/



          /*const resultLayer = await this.$store.state.cityPyO.getSimulationResultLayerSource("wind", this.windScenarioHash)
          console.log("got wind result layer source")
          console.log("add me to the map")
          console.log(resultLayer)*/
        },
        getWindResultsOld () {
          this.$store.dispatch(
            // todo action to get results for wind, solar, sun
            'scenario/updateNoiseScenario'
          ).then(() => {
            // todo set wind map??
            this.$store.commit("scenario/noiseMap", true);
          })
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
        <!-- todo make button pulsate if changed -->
      <v-btn @click="sendScenarioToCityPyo()" :class="{ disabled: !this.windResultComplete}">Save Scenario | Calculate</v-btn>       Load Wind Results
      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear>...</v-progress-linear>
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
