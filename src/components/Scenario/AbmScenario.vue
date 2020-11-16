<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import {
    bridges,
    moduleSettingNames,
    bridgeVeddelOptions,
    mainStreetOrientationOptions,
    blockPermeabilityOptions,
    roofAmenitiesOptions,
    filters,
    filterOptions,
    workshopScenarioNames
} from '@/store/abm.ts'
import TimeSheet from "@/components/Scenario/TimeSheet.vue";
//import { filter } from 'vue/types/umd';

export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            designScenarioNames: bridges,
            moduleSettingOptions: moduleSettingNames,
            bridgeVeddelOptions: bridgeVeddelOptions,
            mainStreetOrientationOptions: mainStreetOrientationOptions,
            blockOptions: blockPermeabilityOptions,
            roofAmenitiesOptions: roofAmenitiesOptions,
            filters: filters,
            filterOptions: filterOptions,
            filterSettings: {},
            workshopScenarioNames: workshopScenarioNames,
            age: 21,
            timePaths: [],
            weightData:[],
            weightObjData:[],
            timeRange:[0, 54000],
            adjustRange:[8, 23],
            datamsg:'',
            heatMapType:'average',
            btnlabel: 'Generate Aggregation Layer',
            reloadHeatMapLayer: false
        }
    },
    computed: {
        ...mapState(['selectedFeatures']),
        ...mapState('scenario', ['resultLoading']), // getter only
        ...mapState('scenario', ['moduleSettings']), // getter only
        // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
        ...generateStoreGetterSetter([
            ['resultOutdated', 'scenario/resultOutdated'],
            ['currentlyShownScenarioSettings', 'scenario/currentlyShownScenarioSettings'],
            ['bridge_hafencity', 'scenario/moduleSettings/' + moduleSettingNames.bridge_hafencity],
            ['bridge_veddel', 'scenario/moduleSettings/' + moduleSettingNames.bridge_veddel],
            ['main_street_orientation', 'scenario/moduleSettings/' + moduleSettingNames.mainStreetOrientation],
            ['blocks', 'scenario/moduleSettings/' + moduleSettingNames.blocks],
            ['roof_amenities', 'scenario/moduleSettings/' + moduleSettingNames.roofAmenities],
            ['agent_age', 'scenario/scenarioViewFilters/' + filters.agent_age],
            ['resident_or_visitor', 'scenario/scenarioViewFilters/' + filters.resident_or_visitor],
            ['foot', 'scenario/scenarioViewFilters/modes/' + filterOptions.foot],
            ['bicycle', 'scenario/scenarioViewFilters/modes/' + filterOptions.bicycle],
            ['public_transport', 'scenario/scenarioViewFilters/modes/' + filterOptions.public_transport],
            ['car', 'scenario/scenarioViewFilters/modes/' + filterOptions.car],
        ]),
        abmData(){
            return this.$store.state.scenario.abmData;
        },
        filterSet(){
            return this.$store.state.scenario.clusteredAbmData;
        },
        activeAbmSet(){
            return this.$store.state.scenario.activeAbmSet;
        },
        filterActive(){
            return this.$store.state.scenario.filterActive;
        },
        heatMap(){
            return this.$store.state.scenario.heatMap;
        },
        workshop(){
            return this.$store.state.workshop;
        },
        showUi(){
            return this.$store.state.scenario.showUi;
        }
    },
    watch: {
        moduleSettings: {
          handler: function () {
            this.areResultsOutdated()
          },
          deep:true
        },
        resultsOutdated(newVal, oldVal) {
          console.log("changes made")
          console.log(newVal, oldVal)
        },
        abmData() {
            /*this.processAbmDataForHeatmap();
            this.reloadHeatMapLayer = true;
            */
        },
        filterSet(){
            for(var key in this.filterSet){
                this.filterSettings[key] = true;
            }
        },
        heatMap(){
            if(this.heatMap) {
                this.btnlabel = "Unplug Aggregation Layer"
            } else if (!this.heatMap) {
                this.btnlabel = "Generate Aggregation Layer"
            }
        }
    },
    mounted: function() {
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
    },
    methods: {
        areResultsOutdated() {
          // TODO for filters as well , not only for settings
          this.resultOutdated = JSON.stringify(this.currentlyShownScenarioSettings) !== JSON.stringify(this.moduleSettings)
        },
        confirmSettings () {
          // update currentlyShowScenarioSettigns
          this.currentlyShownScenarioSettings = JSON.parse(JSON.stringify(this.moduleSettings))
          this.changesMade = false
          this.resultOutdated = false
          this.$store.dispatch(
                'scenario/updateAbmDesignScenario'
            )
        },
        /*retransformating abmData fitting for TimeMap*/
        /*cluster Time Stamp Data for rounded full hours*/
        clusterTimeData(){
            if (this.abmData) {
                this.timePaths = [];
                this.abmData.forEach((v,i,a) => {
                    v.timestamps.forEach((vv,ii,aa) => {
                    /*round timestamps to full hours*/
                       var h = Math.floor(vv / 3600) + 8;
                       /*create Object with hours as Keys and according path data (array) as values*/
                       this.timePaths[h] = this.timePaths[h] || [];
                       this.timePaths[h].push(v.path[ii]);
                    });
                });

                /*calculating Weight value for each coordinate (sum up appearences of unique coordinates*/
                this.timePaths = Object.values(this.timePaths).map(arr => {

                    let weightCount = {};

                    const newArr = arr.map(value => {
                        return value.join() /*formating coordinates to string to make them readable*/
                    }).sort().forEach(value => {
                        /*creating Object with unique coordinates as Keys and number of instances of coordinate as Weight value*/
                        weightCount[value] = (weightCount[value] +1)  ||  1;
                    });

                    const objArr = weightCount;
                    return objArr;

                    /*pre clustering time data done*/
                });
            }

        },
        changeHeatMapData(range){
            if(this.heatMap){
                this.getWeightData(range);
            }
        },
        getWeightData(range) {
            /*range from slider*/
            this.weightData = [];
            this.weightObjData = [];

            if(this.abmData) {
                this.datamsg = "ABM Data loaded";

                let filterTimeObj = Object.assign({},this.timePaths);

                console.log(filterTimeObj);

                let timeCoordData = {};

                /*rearranging object data*/
                for (const [key, value] of Object.entries(filterTimeObj)) {
                    key = `${key}`;
                    value = `${value}`;

                    /*Only take the values from hours in slider range*/
                    if(key >= range[0] - 8 && key <= range[1] - 8) {
                        /*Add up the values of each hour into new Object*/
                        for (const [coord, weight] of Object.entries(filterTimeObj[key])) {
                            coord = `${coord}`;
                            weight = `${weight}`;

                            timeCoordData[coord] = + weight || weight;
                        };
                    } else {
                        /*delete Object key outside of slider range*/
                        delete filterTimeObj[key];
                    }
                }

                var finalDataSet = [];
                var averageDataSet = [];

                /*reformating Object into Array Of Object so it fits deck.gl heatmap data requirements*/
                for(const [key, value] of Object.entries(timeCoordData)) {
                    key = `${key}`;
                    value = `${value}`;

                    let int = parseInt(value);
                    /*split Coordinates Strings back to Integer Arrays*/
                    /*create relative values*/
                    let coordinate = { Coordinates: key.split(",").map(Number), Weight: int};
                    /*create average values*/
                    let coordinateA = { Coordinates: key.split(",").map(Number), Weight: 1};
                    finalDataSet.push(coordinate);
                    averageDataSet.push(coordinateA);
                }

                /*commit final data for heatmap to store*/
                this.$store.commit("scenario/heatMapData", finalDataSet);
                this.$store.commit("scenario/heatMapAverage", averageDataSet);

             } else {
                this.datamsg = "No ABM Data loaded";
            }

        },
        reloadHeatMap(){
            this.$store.commit("scenario/heatMapType", this.heatMapType);
        },
        heatMapActive(){
            this.$store.commit("scenario/heatMap", !this.heatMap);

            if(this.heatMap){
                this.getWeightData(this.adjustRange);
            }
        },
        processAbmDataForHeatmap(){
          /*
          this.clusterTimeData();
          if(this.reloadHeatMapLayer){
              this.getWeightData(this.adjustRange);
          }
           */
        },
        updateFilter(){
            this.$store.dispatch('scenario/filterAbmCore', this.filterSettings);
            this.$store.commit("scenario/filterSettings", {...this.filterSettings});
            console.log(this.filterSettings);
            for(var key in this.filterSettings){
                if(!this.filterSettings[key]) {
                    this.$store.commit("scenario/filterActive", true);
                    return;
                } else {
                    this.$store.commit("scenario/filterActive", false);
                }
            }
        },
        loadWorkshopScenario(scenarioId) {
            this.$store.dispatch(
            'scenario/loadWorkshopScenario', scenarioId
            )
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
                      <v-tooltip left>
                        <template v-slot:activator="{ on, attrs }">
                          <v-icon
                            v-bind="attrs"
                            v-on="on"
                          >{{division.pic}}</v-icon>
                        </template>
                        <span>{{ division.title }}</span>
                      </v-tooltip>
                    </div>
                </li>
            </ul>
        </div>

        <!--each div element needs data-title and data-pic for autocreating menu buttons-->
        <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
        <div v-if="!workshop" class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Scenario'" class="component_content">
               <h2>ABM Scenario Settings</h2>
                <v-container fluid>
                        <header class="text-sm-left">
                            BRIDGES
                        </header>
                        <v-switch
                            v-model="bridge_hafencity"
                            flat
                            label="Bridge to HafenCity"
                            dark
                            :color="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? '#FD805D' : '#888'"
                            :class="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? 'switched' : 'na'"
                        />
                        <v-radio-group v-model="bridge_veddel" :class="currentlyShownScenarioSettings.bridge_veddel != bridge_veddel ? 'switched' : 'na'">
                            <v-radio
                                :value="bridgeVeddelOptions.diagonal"
                                flat
                                label="Bridge to S Veddel (North)"
                                dark
                                :color="currentlyShownScenarioSettings.bridge_veddel != bridge_veddel ? '#FD805D' : '#888'"
                            />
                          <v-radio
                            :value="bridgeVeddelOptions.horizontal"
                            flat
                            label="Bridge to S Veddel (South)"
                            dark
                            :color="currentlyShownScenarioSettings.bridge_veddel != bridge_veddel ? '#FD805D' : '#888'"
                          />
                        </v-radio-group>
                        <header class="text-sm-left">
                            MAIN STREET ORIENTATION
                        </header>
                        <v-radio-group v-model="main_street_orientation" :class="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? 'switched' : 'na'">
                            <v-radio
                                :value="mainStreetOrientationOptions.vertical"
                                flat
                                label="North-South Axes"
                                    dark
                                :color="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? '#FD805D' : '#888'"
                            />
                            <v-radio
                                :value="mainStreetOrientationOptions.horizontal"
                                flat
                                label="East-West Axes"
                                dark
                                :color="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                          CITY BLOCK STRUCTURE
                        </header>
                        <v-radio-group v-model="blocks" :class="currentlyShownScenarioSettings.blocks != blocks ? 'switched' : 'na'">
                            <v-radio
                                :value="blockOptions.open"
                                flat
                                label="Permeable"
                                dark
                                :color="currentlyShownScenarioSettings.blocks != blocks ? '#FD805D' : '#888'"

                            />
                            <v-radio
                                :value="blockOptions.closed"
                                flat
                                label="Private"
                                dark
                                :color="currentlyShownScenarioSettings.blocks != blocks ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                          AMENITY DISTRIBUTION
                        </header>
                        <v-radio-group v-model="roof_amenities" :class="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? 'switched' : 'na'">
                            <v-radio
                                :value="roofAmenitiesOptions.complementary"
                                flat
                                label="Clustered by Type"
                                dark
                                :color="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? '#FD805D' : '#888'"
                            />
                            <v-radio
                                :value="roofAmenitiesOptions.random"
                                flat
                                label="Mixed Distribution"
                                dark
                                :color="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                    </v-container>

                    <v-btn @click="confirmSettings" class="confirm_btn" :class="{ changesMade : resultOutdated }">
                      Run Scenario
                    </v-btn>

                    <v-overlay :value="resultLoading">
                        <div>Loading results</div>
                        <v-progress-linear>...</v-progress-linear>
                    </v-overlay>
           </div><!--component_content end-->
        </div><!--division end-->

        <!--SCENARIO DIVISION FOR WORKSHOP ONLY-->
        <div v-if="workshop" class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Scenario'" class="component_content">
               <h2>ABM Scenario Selection</h2>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[0])" class="scenario_main_btn" block>Default Planning</v-btn>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[1])" class="scenario_main_btn" block>Session I</v-btn>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[2])" class="scenario_main_btn" block>Session II</v-btn>

             <v-overlay :value="resultLoading">
               <div>Loading results</div>
               <v-progress-linear>...</v-progress-linear>
             </v-overlay>
           </div>
        </div><!--division-end-->

        <!--each div element needs data-title and data-pic for autocreating menu buttons-->
        <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
        <div v-if="!workshop" class="division" data-title='Dashboard' data-pic='mdi-view-dashboard'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Dashboard'" class="component_content">
               <h2>ABM Dashboard</h2>
                <ul>
                    <li>Number Of Agents active: </li>
                    <li>Average length of track: </li>
                    <li>Stuff like this: </li>
                </ul>
           </div><!--component_content end-->
        </div><!--division end-->

        <div class="division" data-title='Filter' data-pic='mdi-filter'>
            <div v-if="activeDivision === 'Filter'" class="component_content">

            <h2>ABM Scenario Filters</h2>
            <v-container fluid>
                            <v-checkbox
                                v-model="filterSettings.resident"
                                flat
                                label="Show Residents"
                                dark
                                @change="updateFilter"
                            ></v-checkbox>
                            <v-checkbox
                                v-model="filterSettings.visitor"
                                flat
                                label="Show Visitors"
                                dark
                                @change="updateFilter"
                            ></v-checkbox>
                            <!--<v-radio
                                :value="filterOptions.any"
                                flat
                                label="Residents & Visitors"
                                dark
                            />-->
                        <v-container fluid>
                          <v-checkbox
                            hide-details
                              v-model="filterSettings['0-6']"
                              flat
                              label="0-6 years"
                              dark
                              @change="updateFilter"
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['7-17']"
                              flat
                              label="7-17 years"
                              dark
                              @change="updateFilter"
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['18-35']"
                              flat
                              label="18-35 years"
                              dark
                              @change="updateFilter"
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['36-60']"
                              flat
                              label="36-60 years"
                              dark
                              @change="updateFilter"
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['61-100']"
                              flat
                              label="61-100 years"
                              dark
                              @change="updateFilter"
                          />
                        </v-container>
                        <v-switch
                            v-model="filterSettings.foot"
                            flat
                            label="Walking"
                            dark
                            @change="updateFilter"
                        />
                        <v-switch
                            v-model="filterSettings.bicycle"
                            flat
                            label="Biking"
                            dark
                            @change="updateFilter"
                        />
                        <v-switch
                            v-model="filterSettings.public_transport"
                            flat
                            label="Public Transport"
                            dark
                            @change="updateFilter"
                        />
                        <v-switch
                            v-model="filterSettings.car"
                            flat
                            label="Cars"
                            dark
                            @change="updateFilter"
                        />
                    </v-container>

                   <!--<v-btn @click="confirmSettings" class="confirm_btn">
                        Run Scenario
                    </v-btn>-->

                    <v-overlay :value="resultLoading">
                        <div>Loading ABM results</div>
                        <v-progress-linear>...</v-progress-linear>
                    </v-overlay>
            </div>
        </div>

        <div class="division" data-title='Aggregation Layer' data-pic='mdi-gauge'>
           <div v-if="activeDivision === 'Aggregation Layer'" class="component_content">
            <h2>Capacity Use Map</h2>
               <v-range-slider
                    v-model="adjustRange"
                    :min="8"
                    :max="24"
                    hide-details
                    dark
                    class="align-center"
                    @change="changeHeatMapData(adjustRange)"
               >
                    <template v-slot:prepend>
                        <v-text-field
                            :value="adjustRange[0]"
                            class="mt-0 pt-0"
                            hide-details
                            single-line
                            type="number"
                            style="width: 30px"
                        ></v-text-field>
                    </template>
                    <template v-slot:append>
                        <v-text-field
                            :value="adjustRange[1]"
                            class="mt-0 pt-0"
                            hide-details
                            single-line
                            type="number"
                            style="width: 30px"
                        ></v-text-field>
                    </template>
               </v-range-slider>
               <p>{{datamsg}}</p>
               <v-btn @click="heatMapActive">{{ btnlabel }}</v-btn>

               <div v-if=(heatMap) class="additional">
                   <div class="additional_options">
                       <template>
                            <v-container fluid>
                                <p>{{ heatMapType || 'null' }}</p>
                                <v-radio-group v-model="heatMapType" :mandatory="true" @change="reloadHeatMap" dark>
                                    <v-radio label="Average Data" value="average"></v-radio>
                                    <v-radio label="Relative Data" value="relative"></v-radio>
                                </v-radio-group>
                            </v-container>
                            </template>
                    </div>
               </div>
           </div>
        </div>

        <!--<v-expansion-panels>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM SCENARIO</v-expansion-panel-header>
                <v-expansion-panel-content>

                </v-expansion-panel-content>
                <v-overlay :value="isLoading">
                    <div>Loading ABM results</div>
                    <v-progress-linear>...</v-progress-linear>
                </v-overlay>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM FILTERS</v-expansion-panel-header>
                <v-expansion-panel-content>

                </v-expansion-panel-content>
            </v-expansion-panel>

        </v-expansion-panels>

        <div class='sub'>
        </div>-->
    </div>
</template>

<style lang="scss" scoped>
    @import "../../style.main.scss";

  #scenario {
    height: 100%;
    width: 100%;

    .scenario_main_btn {
        height:200px;
        line-height:200px;
        text-align:center;
        color:whitesmoke;
        margin:10px auto;
        border-radius:0px;
        background:rgba(0,0,0,0.9);
        border:1px solid #aaa;
        @include drop_shadow;
    }

    .v-input {
        ::v-deep.v-input__control{
            .v-input--radio-group__input {
                .v-radio {
                    opacity:0.35;

                    &.v-item--active{
                        opacity:1;
                    }
                }
            }
        }

        &.switched {
            ::v-deep.v-input__control {
                label {
                    color:#FD805D;
                }
                .v-input--switch__thumb {
                    background: #FD805D;
                    opacity:0.8;
                }
            }
        }
    }

  }
</style>
