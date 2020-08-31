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
    // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
    ...generateStoreGetterSetter([
      ['traffic_scenario', 'scenario/noiseScenario/' + noiseSettingsNames.traffic_scenario],
      ['max_speed', 'scenario/noiseScenario/' + noiseSettingsNames.max_speed],
    ])
    },
    watch: {
      max_speed(newVal, old) {
        console.log("max_speed", newVal, old)
      },
      traffic_scenario(newVal, old) {
        console.log("max_speed", newVal, old)
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
        confirmSettings () {
            this.$store.dispatch(
                'scenario/updateNoiseScenario'
            )
        },
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
            v-model="traffic_scenario"
            :tick-labels="traffic_percent_labels"
            :max="4"
            ticks="always"
            tick-size="5"
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
      <v-btn @click="confirmSettings" class="confirm_btn">
        Show Noise Result
      </v-btn>
      </div> <!--component_content end-->
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
