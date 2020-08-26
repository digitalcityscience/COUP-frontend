<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'

export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
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
    methods: {
      confirmSettings () {
        this.$store.dispatch(
          'scenario/updateNoiseScenario'
        )
      },
    },
    watch: {
      max_speed(newVal, old) {
        console.log("max_speed", newVal, old)
      },
      traffic_scenario(newVal, old) {
        console.log("max_speed", newVal, old)
      }
    }
}


</script>

<template>
    <div class="component_body">
      <div class="division">
      <v-container fluid>
        <p>Choose Noise Scenario</p>

        <header class="text-sm-left">
          Motorized Traffic Level</header>
        <v-card-text>
          <v-slider
            v-model="traffic_scenario"
            :tick-labels="traffic_percent_labels"
            :max="4"
            ticks="always"
            tick-size="5"
            dark
          ></v-slider>
        </v-card-text>
        </v-card>



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
      </div>
      <v-btn @click="confirmSettings" class="confirm_btn">
        Show Noise Result
      </v-btn>
      </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";
</style>
