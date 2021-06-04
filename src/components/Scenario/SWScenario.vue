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
import hash from 'object-hash'

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
          returnPeriod: 2,
          returnPeriodOptions: [
            {
              "value": 2,
              "label": "2yr Event"
            },
            {
              "value": 10,
              "label": "10yr Event"
            },
            {
              "value": 100,
              "label": "100yr Event"
            },
          ],
          flowPath: "blockToPark",
          flowPathOptions: [
            {
              "value": "blockToPark",
              "label": "Building > Block > Park"
            },
            {
              "value": "blockToStreet",
              "label": "Building > Block > Street"
            }
          ],
          greenRoofs: "extensive",
          greenRoofOptions: [
            {
              "value": "extensive",
              "label": "Extensive Green Roofs"
            },
            {
              "value": "intensive",
              "label": "Intensive Green Roofs"
            },
          ],
          /*
          improvedTreePits: true,
          treePitOptions: [
            {
              "value": true,
              "label": "Improved Tree Pits"
            },
            {
              "value": false,
              "label": "Other Trees"
            }
          ],
          */
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
        ...generateStoreGetterSetter([
          ['stormWaterScenarioHash', 'scenario/' + 'stormWaterScenarioHash'],  // todo stormWater store
          ['resultLoading', 'scenario/' + 'resultLoading'],  // todo manage stores
          ['savedStormWaterScenarios', 'scenario/' + 'savedStormWaterScenarios'],  // todo manage stores
          ['stormWaterScenario', 'scenario/' + 'stormWaterScenario'],  // todo manage stores
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
          const resultLayer = await this.$store.state.cityPyO.getSimulationResultForScenario(
            "stormwater",
            this.stormWaterScenarioHash
          )
          console.log("got stormwater result layer source")
          console.log("add me to the map")
          console.log(resultLayer)
          // this.generateGraphData(resultLayer)
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
        generateGraphData(resultLayer) {
          const features = resultLayer.source.options.data.features
          console.log("features", features)

          // each point in time calculate total runoff
          let totalRunOffs = {}
          features.forEach(feature => {
            if (feature.properties["runoff_results"]) {
              console.warn("feature timestamps", feature.properties["runoff_results"]["timestamps"])
              const timestamps = feature.properties["runoff_results"]["timestamps"]
              timestamps.forEach(timestamp => {
                if (!totalRunOffs[timestamp]) {
                  totalRunOffs[timestamp] = 0
                }
                totalRunOffs[timestamp] += feature.properties["runoff_results"]["runoff_value"][timestamp]
              })
            }
          })
          console.warn("total runoffs", totalRunOffs)

          // TODO rebuild birds dummyObject, but now with real values
        },
        generateDummyData(storm){
            this.dummyObject = {};
            Subcatchments.features.forEach(feature => {
                if(feature.properties.sub_id != null){
                    this.dummyObject[feature.properties.sub_id] = {};
                    this.dummyObject[feature.properties.sub_id].type = feature.properties.S_Type;
                    this.dummyObject[feature.properties.sub_id].roof = feature.properties.Roof_Type;
                    this.dummyObject[feature.properties.sub_id].geometry = feature.geometry.coordinates.flat(1);
                    this.dummyObject[feature.properties.sub_id].runoff =[];

                    for(var i = 0; i < 288; i++){
                        let hour;
                        prev ? prev = prev : prev = 1;
                        i != 0 ? hour = Math.floor(i/12) : hour = 0;
                        let runoff = this.getRandomDummyValue(prev, Rain[storm][hour]);
                        var prev = runoff;
                        this.dummyObject[feature.properties.sub_id].runoff.push(runoff);
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
        getRoofTypeString() {
          if (this.greenRoofs === "extensive") {
            return "GR-EX1"
          }
          return "GR-IN1"
        },
        runScenario() {
          this.updateStormWaterScenario()

          // this is just showing fake results
          const returnPeriodString = this.returnPeriod.toString() + "yr"
          this.changeRain(returnPeriodString)
          // end of fake results */

          // TODO get and display results
          // this.getStormWaterResult()

        },
        updateStormWaterScenario() {
          this.stormWaterScenario = {
            "returnPeriod": this.returnPeriod,
            "flowPath": this.flowPath,
            "greenRoofs": this.greenRoofs,
            // "treePits": this.treePits
          }
          // this.stormWaterScenarioHash = hash(this.stormWaterScenario)
          this.stormWaterScenarioHash = this.flowPath + "_" + this.greenRoofs + "_" + this.returnPeriod
          this.stormWaterScenario["hash"] = this.stormWaterScenarioHash
        },
        isResultOutdated() {
          console.warn("input changed")
          if (!this.stormWaterScenario) {
            this.resultOutdated = false;
          } else {
            this.resultOutdated = (
              this.returnPeriod !== this.stormWaterScenario["returnPeriod"]
              || this.flowPath !== this.stormWaterScenario["flowPath"]
              || this.greenRoofs !== this.stormWaterScenario["greenRoofs"]
              // || this.treePitzs !== this.stormWaterScenario["treePits"]
            )
          }
          }
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
                TIMESERIES
              </header>
              <v-radio-group v-model="returnPeriod" @change="isResultOutdated()">
                <v-radio
                  :value="returnPeriodOptions[0].value"
                  flat
                  :label="returnPeriodOptions[0].label"
                  dark
                />
                <v-radio
                  :value="returnPeriodOptions[1].value"
                  flat
                  :label="returnPeriodOptions[1].label"
                  dark
                />
                <v-radio
                  :value="returnPeriodOptions[2].value"
                  flat
                  :label="returnPeriodOptions[2].label"
                  dark
                />
              </v-radio-group>
            </div>
            <div v-if="stormWater" class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
              <header class="text-sm-left">
                FLOW PATH
              </header>
              <v-radio-group v-model="flowPath" @change="isResultOutdated()">
                <v-radio
                  :value="flowPathOptions[0].value"
                  flat
                  :label="flowPathOptions[0].label"
                  dark
                />
                <v-radio
                  :value="flowPathOptions[1].value"
                  flat
                  :label="flowPathOptions[1].label"
                  dark
                />
              </v-radio-group>
            </div>
          <div v-if="stormWater" class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
              <header class="text-sm-left">
                ROOFS
              </header>
              <v-radio-group v-model="greenRoofs" @change="isResultOutdated()">
                <v-radio
                  :value="greenRoofOptions[0].value"
                  flat
                  :label="greenRoofOptions[0].label"
                  dark
                />
                <v-radio
                  :value="greenRoofOptions[1].value"
                  flat
                  :label="greenRoofOptions[1].label"
                  dark
                />
              </v-radio-group>
            </div>
            <!-- hidden for now
            <div v-if="stormWater" class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
              <header class="text-sm-left">
                TREES
              </header>
              <v-radio-group v-model="improvedTreePits" @change="isResultOutdated()">
                <v-radio
                  :value="treePitOptions[0].value"
                  flat
                  :label="treePitOptions[0].label"
                  dark
                />
                <v-radio
                  :value="treePitOptions[1].value"
                  flat
                  :label="treePitOptions[1].label"
                  dark
                  />
              </v-radio-group>

            </div>   TREE PITS DIV -->
            <v-btn @click="runScenario()"
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
          <h4>SWMM SIMULATION ENGINE</h4>
          <p>
            The Stormwater Module uses EPA SWMM as the engine to simulate stormwater runoff. EPA SWMM is an open source software developed and maintained by the United States Environmental Protection Agency.
            Simulations are carried out using Version 5.1.015. SWMM can be downloaded from the US EPA website: https://www.epa.gov/water-research/storm-water-management-model-swmm.
          <h4>LENGTH OF SIMULATION</h4>
          <p>
          SWMM can be used for single event or long-term simulations. The Stormwater Module models only event storms. To model event storm precipitation, we use KOSTRA-DWD-2010R data for the Grasbrook site and apply Euler II for the rainfall distribution curve.
          <br>
          </p>
          <h4>RESULTS DISPLAYED - RUNOFF</h4>
          <p>
            SWMM can output a varied of indicators and time series (see SWMM User Manual). In the current version of the Stormwater Module, we display only the results for stormwater runoff.
          </p>
          <h4>MODEL PARAMETERS</h4>
          <p>
            Default values from the SWMM User’s Manual were used to set up the model. The surfaces type categories used in the model are adapted from the BIM buildings and spaces files.
            Validation of the model has not been performed, however, due to lack of data (e.g. long-term monitoring data of of a comparable watershed).
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
