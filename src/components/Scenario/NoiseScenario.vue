<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'

export default {
    name: 'NoiseScenario',
    components: {},
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            traffic_percent_labels: [
              '0%',
              '25%',
              '50%',
              '75%',
              "100%"
            ]
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading']), // getter only
      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      ...generateStoreGetterSetter([
      ['noiseMap', 'scenario/' + 'noiseMap'],
      ['traffic_percent', 'scenario/noiseScenario/' + noiseSettingsNames.traffic_percent],
      ['max_speed', 'scenario/noiseScenario/' + noiseSettingsNames.max_speed],
    ])
    },
    watch: {
      max_speed(newVal, old) {
        this.loadNoiseMap()
      },
      traffic_percent(newVal, old) {
        this.loadNoiseMap()
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
        loadNoiseMap () {
            this.$store.dispatch(
                'scenario/updateNoiseScenario'
            ).then(() => {
              this.$store.commit("scenario/noiseMap", true);
            })
        },
        loadNoiseResults () {
            this.loadNoiseMap()
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
        <h2>Choose Noise Scenario</h2>
        <v-container fluid>
          <header class="text-sm-left">
            Motorized Traffic Level</header>
          <v-slider
            v-model="traffic_percent"
            step=0.25
            thumb-label="always"
            label="%"
            thumb-size="25"
            ticks="always"
            tick-size="4"
            :tick-labels="traffic_percent_labels"
            min="0"
            max="1"
            dark
            flat
          ></v-slider>
          <header class="text-sm-left">
            Max. Speed
          </header>
        <v-radio-group v-model="max_speed">
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
      </v-container>
      <v-btn @click="loadNoiseResults" :disabled="noiseMap"  class="confirm_btn" >
       Load Noise Results
      </v-btn>
      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear>...</v-progress-linear>
      </v-overlay>
      <div class="disclaimer">
        <h2>Disclaimer</h2>
        <p>The tool focusses on providing rapid analyses of urban design iterations based on a simplified input. Results provided do not substitute in-depth analyses.
          The platform and its analysis modules are currently in the testing phases and are subject to ongoing development.
          Scientific validity of the results cannot be guaranteed in the testing phases.</p>
      </div>
      </div> <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
