<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import { noiseSettingsNames } from '@/store/noise'
import hash from 'object-hash'

export default {
    name: 'SunExposureResults',
    components: {},
    props: {
      restrictedAccess: Boolean
    },
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            showError: false,
            sunExposureLoaded: false
        }
    },
  computed: {
      ...mapState('scenario', ['resultLoading']), // getter only

      // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
      /*...generateStoreGetterSetter([
        ['resultLoading', 'scenario/' + 'resultLoading'],  // todo manage stores
      ])*/
    },
    watch: {
    },
    mounted:
        function() {
          // hide all other layers
          this.$store.dispatch(
            'hideAllLayersButThese',
            ['sun_exposure']
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
      async loadResult() {
        this.$store.dispatch('scenario/addSunExposureLayer').then(() => {
          this.$store.commit("scenario/sunExposureLayer", true);
          this.sunExposureLoaded = true;
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
      <div v-if="activeDivision === 'Scenario'" class="component_content scenario">
        <v-container fluid>
        <!--- SUN EXPOSURE -->
        <h2>Sun Exposure</h2>

        <div class="scenario_box" :class="!sunExposureLoaded ? 'highlight' : ''">
            <header class="text-sm-left">
              h/day <br>
              Hours of sunlight per day averaged over a year
            </header>
          </div>
          <v-btn
            style="margin-top: 1vh;"
            @click="loadResult()"
            class="confirm_btn"
          >
          Run Scenario
          </v-btn>

          <div class="disclaimer">
            <h2>Disclaimer</h2>
            <p>Results provided by InfraredCity @ AIT <br>
            The model was trained on the solar characteristics of Vienna, AT</p>
          </div>
        </v-container>

      </div> <!--component_content end-->
      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear style="margin-top: 50px;">...</v-progress-linear>
      </v-overlay>
    </div><!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";


</style>
