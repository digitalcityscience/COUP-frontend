<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import Junctions from '@/config/nodes.json'
import Subcatchments from '@/config/subcatchments.json'
import Pipes from '@/config/links.json'
import Rain from '@/config/rain.json'
import { swLayerName } from "@/store/deck-layers";
import CityPyo from "@/store/cityPyO";
import Legend from "@/components/Scenario/Legend";

export default {
    name: 'StormwaterScenario',
    components: {
      Legend: Legend
    },
    data () {
        return {
          activeDivision:null,
          componentDivisions: [],
          resultOutdated: false,
          resultLoading: false,

            // bird
            dummyObject: {},
            rainAmount: "2yr",
            rainTime:"test",
        }
    },
    computed:{
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'layers',
            'layerIds',
        ]),
        stormWater(){
            return this.$store.state.scenario.stormWater;
        },
        swData(){
            return this.$store.state.scenario.swData;
        }
    },
    watch: {
        swData(){
            this.$store.dispatch('scenario/addSWLayer',  this.swData);
        },
    },
    beforeMount() {
      // todo remove this
      this.activateStormWater()
    },
    mounted:
        function() {
          // hide all other layers
          this.$store.dispatch(
            'hideAllLayersButThese',
            ['stormwater']
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
        async getStormWaterResult() {
          // todo create an action for this
          const scenario_hash = "xyz123"
          const resultLayer = await this.$store.state.cityPyO.getStormwaterResultLayerSource(scenario_hash)
          console.log("got stormwater result layer source")
          console.log("add me to the map")
          console.log(resultLayer)
        },
        sendScenarioToCityPyo() {
          const fileName = "stormwater_scenario"
          // prop path is the path to the property inside the file that shall be updated. in this case the scenario description
          // for our scenario name "scenario_1"
          const propPath = ["scenario_1"]   // we could imagine to let the user create multiple scenarios to compare...
          const payload = {
            "hash": "NEW HASH",
            "model_updates":
              [
                {
                  "subcatchment_id": "Sub000",
                  "outlet_id": "J_out17"
                },
                {
                  "subcatchment_id": "Sub001",
                  "outlet_id": "J_out18"
                }
              ],
            "rain_event" : {
              "return_period": 100,
              "duration": 120
            }
          }
          this.$store.state.cityPyO.addLayerData(fileName, propPath, payload)
        },
        activateStormWater(){
            this.generateDummyData("2yr");
            this.$store.commit("scenario/rainAmount", Rain['2yr']);
            this.$store.commit("scenario/stormWater", true);
            this.$store.commit("scenario/selectGraph", "sw");
        },
        generateDummyData(storm){
            this.dummyObject = {};
            Subcatchments.features.forEach(feature => {
                if(feature.properties.city_scope != null){
                    this.dummyObject[feature.properties.city_scope] = {};
                    this.dummyObject[feature.properties.city_scope].type = feature.properties.S_Type;
                    this.dummyObject[feature.properties.city_scope].roof = feature.properties.Roof_Type;
                    this.dummyObject[feature.properties.city_scope].geometry = feature.geometry.coordinates.flat(1);
                    this.dummyObject[feature.properties.city_scope].runoff =[];

                    for(var i = 0; i < 288; i++){
                        let hour;
                        prev ? prev = prev : prev = 1;
                        i != 0 ? hour = Math.floor(i/12) : hour = 0;
                        let runoff = this.getRandomDummyValue(prev, Rain[storm][hour]);
                        var prev = runoff;
                        this.dummyObject[feature.properties.city_scope].runoff.push(runoff);
                    }
                }
            });

            console.log(this.dummyObject);
            this.$store.commit("scenario/swData", this.dummyObject);
        },
        getRandomDummyValue(min,max){
            let maxR; let minR;
            if(min > max){ maxR = min; minR = max } else { maxR = max; minR = min };
            return Math.floor(Math.random() * (maxR - minR + 1) + minR);
        },
        changeRain(rain){
            this.rainAmount = rain;
            this.generateDummyData(rain);
            this.$store.commit("scenario/rainAmount", Rain[rain]);
            //this.sendScenarioToCityPyo()
            //this.getStormWaterResult()
        },
    },
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
      <div v-if="activeDivision === 'Scenario'" class="component_content scenario">
        <v-container fluid>
          <h2>Stormwater Scenario Settings</h2>
            <div v-if="stormWater" class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
              <header class="text-sm-left">
                RAIN TYPE
              </header>
              <v-radio-group v-model="rainAmount">
                <v-radio
                  :value="'2yr'"
                  flat
                  label="2yr Event"
                  dark
                />
                <v-radio
                  :value="'10yr'"
                  flat
                  label="10yr Event"
                  dark
                />
                <v-radio
                  :value="'100yr'"
                  flat
                  label="100yr Event"
                  dark
                />
              </v-radio-group>
            </div>
            <v-btn @click="changeRain(rainAmount)"
                   class="confirm_btn"
                   :class="{ changesMade : resultOutdated }"
                   :disabled="resultLoading"
            >
              Run Scenario
            </v-btn>
        </v-container>

        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear>...</v-progress-linear>
        </v-overlay>
      </div>  <!--component content end -->
    </div> <!-- division end -->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title='Dashboard' data-pic='mdi-view-dashboard'>
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Stormwater | Dashboard</h2>
        <p>To be developed</p>
      </div><!--component_content end-->
    </div> <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title='info' data-pic='mdi-information-variant'>
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'info'" class="component_content">
        <h2>Stormwater | About</h2>
        <Legend v-bind:topic="'stormwater'"></Legend>

        <!-- text block with subtext blocks, fade out to end to hint for scrolling -->
        <!-- legend color same as background! -->
        <div class="info_text">
          <h4>WHAT IS STORMWATER</h4>
          <p>
            LOREM IPSUM
          <h4>SIMULATION</h4>
          <p>
            SWMMMMMMM?
          </p>

          <h4>COLOR SCHEME</h4>
          <p>
            scheme
          </p>
        </div>

      </div><!--component_content end-->
    </div>   <!--division end-->
  </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";

    .sw_button {
        display:block;
        width:100%;
        margin:10px auto;
        height:40px;
        background:$reversed;
        color:whitesmoke;
        text-align:center;
        line-height:40px;
    }

    .sw_dashboard {
        .storm_selection {
            .v-btn {

                    opacity:1;
                    pointer-events:all;
                &.disabled {
                    opacity:0.5;
                    pointer-events:none;
                }
            }
        }

        .load_vis {
            display:block;
            width:100%;
            height:40px;
            background:$reversed;
            color:whitesmoke;
            line-height:40px;
            margin:10px auto;
            @include drop_shadow;
        }

    }
</style>
