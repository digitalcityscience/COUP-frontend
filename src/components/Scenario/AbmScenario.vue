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
import DashboardCharts from "./DashboardCharts";
import FocusAreasLayer from "@/config/focusAreas.json";
import {getAbmLayerIds} from "@/config/layers";

export default {
    name: 'AbmScenario',
    components: {
      DashboardCharts: DashboardCharts
    },
    props: {
      restrictedAccess: Boolean
    },
    data () {
        return {
            activeDivision:null,
            componentDivisions: [],
            designScenarioNames: bridges,
            moduleSettingOptions: moduleSettingNames,
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
            heatMapType:'default',
            pedestrianModel: true,
            btnlabel: 'Generate Aggregation Layer',
            reloadHeatMapLayer: false,
        }
    },
    computed: {
        ...mapState(['map']),// getter only
        ...mapState('scenario', ['resultLoading']), // getter only
        ...mapState('scenario', ['moduleSettings']), // getter only
        // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
        ...generateStoreGetterSetter([
            ['resultOutdated', 'scenario/resultOutdated'],
            ['focusAreasShown', 'focusAreasShown'],
            ['loader', 'scenario/loader'],
            ['updateAbmStatsChart', 'scenario/updateAbmStatsChart'],
            ['updateAmenityStatsChart', 'scenario/updateAmenityStatsChart'],
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
        abmStats(){
          return this.$store.state.scenario.abmStats;
        },
        amenityStats(){
          return this.$store.state.scenario.amenityStats;
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
        showUi(){
            return this.$store.state.scenario.showUi;
        }
    },
    watch: {
        resultsOutdated(newVal, oldVal) {
          console.log("changes made")
          console.log(newVal, oldVal)
        },
        filterSet(){
            for(var key in this.filterSet){
                this.filterSettings[key] = true;
            }
        },
        heatMap(){
            if(this.heatMap) {
                this.btnlabel = "Hide Aggregation Layer"
            } else if (!this.heatMap) {
                this.btnlabel = "Show Aggregation Layer"
            }
        },
        activeDivision() {
          if (this.activeDivision === 'Dashboard') {
            // load map layer with focus areas
            this.map.setLayoutProperty(FocusAreasLayer.mapSource.data.id, 'visibility', 'visible');
            this.focusAreasShown = true
          } else {
            if (this.map.getLayer(FocusAreasLayer.mapSource.data.id)) {
              // remove map layer with focus areas
              this.map.setLayoutProperty(FocusAreasLayer.mapSource.data.id, 'visibility', 'none');
              this.focusAreasShown = false
            }
          }
        }
    },
    mounted: function() {
        // hide all other layers
        this.$store.dispatch('hideAllLayersButThese', getAbmLayerIds())

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
      confirmSettings() {
        // update currentlyShowScenarioSettigns
        this.currentlyShownScenarioSettings = JSON.parse(JSON.stringify(this.moduleSettings))
        this.changesMade = false
        this.resultOutdated = false
        this.$store.dispatch(
          'scenario/updateAbmDesignScenario'
        )
      },
      changeHeatMapData() {
        if(this.adjustRange[0] > 8 || this.adjustRange[1] < 23){
            this.$store.commit("scenario/loop", true);
        } else {
            this.$store.commit("scenario/loop", false);
        };

        this.$store.commit("scenario/selectedRange", this.adjustRange);
        this.$store.commit("scenario/heatMapType", this.heatMapType);
        this.$store.dispatch("scenario/updateLayers", "heatMap");
      },
      setHeatMapTimes(x, y) {
        this.adjustRange = [x, y];
        this.changeHeatMapData();
      },
      heatMapActive() {
        this.$store.commit("scenario/heatMap", !this.heatMap);
      },
      updateFilter() {
        this.$store.commit("scenario/loader", true);
        this.$store.dispatch('scenario/filterAbmCore', this.filterSettings);
        this.$store.commit("scenario/filterSettings", {...this.filterSettings});

        for (var key in this.filterSettings) {
          if (!this.filterSettings[key]) {
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
                <li v-for="division in componentDivisions" :key="division.title" v-bind:class="[ activeDivision === division.title ? 'highlight' : '', activeAbmSet == 'undefined' || activeAbmSet == null ? 'hidden' : '']">
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
        <div v-if="!restrictedAccess" class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Scenario'" class="component_content scenario">
               <h2>ABM Scenario Settings</h2>
                <v-container fluid>
                    <div class="scenario_box" :class="currentlyShownScenarioSettings.bridge_veddel != bridge_veddel ? 'highlight' : 'na'">
                        <header class="text-sm-left">
                            BRIDGES
                        </header>
                        <v-switch
                            v-model="bridge_hafencity"
                            flat
                            label="Bridge to HafenCity"
                            dark
                            :color="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? '#fff' : '#888'"
                            :class="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? 'switched' : 'na'"
                        />
                       <v-switch
                            v-model="bridge_veddel"
                            flat
                            label="Underpass to Veddel"
                            dark
                            :color="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? '#fff' : '#888'"
                            :class="currentlyShownScenarioSettings.bridge_hafencity != bridge_hafencity ? 'switched' : 'na'"
                        />
                     </div>
                    <div class="scenario_box" :class="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? 'highlight' : 'na'">
                        <header class="text-sm-left">
                            MAIN STREET ORIENTATION
                        </header>
                        <v-radio-group v-model="main_street_orientation" :class="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? 'switched' : 'na'">
                            <v-radio
                                :value="mainStreetOrientationOptions.vertical"
                                flat
                                label="North-South Axes"
                                    dark
                                :color="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? '#fff' : '#888'"
                            />
                            <v-radio
                                :value="mainStreetOrientationOptions.horizontal"
                                flat
                                label="East-West Axes"
                                dark
                                :color="currentlyShownScenarioSettings.main_street_orientation != main_street_orientation ? '#fff' : '#888'"
                            />
                        </v-radio-group>
                    </div>
                    <div class="scenario_box" :class="currentlyShownScenarioSettings.blocks != blocks ? 'highlight' : 'na'">
                        <header class="text-sm-left">
                          CITY BLOCK STRUCTURE
                        </header>
                        <v-radio-group v-model="blocks" :class="currentlyShownScenarioSettings.blocks != blocks ? 'switched' : 'na'">
                            <v-radio
                                :value="blockOptions.open"
                                flat
                                label="Permeable"
                                dark
                                :color="currentlyShownScenarioSettings.blocks != blocks ? '#fff' : '#888'"

                            />
                            <v-radio
                                :value="blockOptions.closed"
                                flat
                                label="Private"
                                dark
                                :color="currentlyShownScenarioSettings.blocks != blocks ? '#fff' : '#888'"
                            />
                        </v-radio-group>
                    </div>
                    <div class="scenario_box" :class="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? 'highlight' : 'na'">
                        <header class="text-sm-left">
                          AMENITY DISTRIBUTION
                        </header>
                        <v-radio-group v-model="roof_amenities" :class="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? 'switched' : 'na'">
                            <v-radio
                                :value="roofAmenitiesOptions.complementary"
                                flat
                                label="Clustered by Type"
                                dark
                                :color="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? '#fff' : '#888'"
                            />
                            <v-radio
                                :value="roofAmenitiesOptions.random"
                                flat
                                label="Mixed Distribution"
                                dark
                                :color="currentlyShownScenarioSettings.roof_amenities != roof_amenities ? '#fff' : '#888'"
                            />
                        </v-radio-group>
                    </div>
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
        <div v-if="restrictedAccess" class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Scenario'" class="component_content">
               <h2>ABM Scenario Selection</h2>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[0])" class="scenario_main_btn" block>Scenario I</v-btn>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[1])" class="scenario_main_btn" block>Scenario II</v-btn>
               <v-btn  @click="loadWorkshopScenario(workshopScenarioNames[2])" class="scenario_main_btn" block>Scenario III</v-btn>

             <v-overlay :value="resultLoading">
               <div>Loading results</div>
               <v-progress-linear>...</v-progress-linear>
             </v-overlay>
           </div>
        </div><!--division-end-->

        <!--each div element needs data-title and data-pic for autocreating menu buttons-->
        <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
        <div class="division" data-title='Dashboard' data-pic='mdi-view-dashboard'>
            <!--v-if needs to be set to data-title to make switch between divisions possible-->
           <div v-if="activeDivision === 'Dashboard'" class="component_content">
               <h2>ABM Dashboard</h2>
                 <DashboardCharts></DashboardCharts>
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
                            ></v-checkbox>
                            <v-checkbox
                                v-model="filterSettings.visitor"
                                flat
                                label="Show Visitors"
                                dark
                            ></v-checkbox>
                            <!--<v-radio
                                :value="filterOptions.any"
                                flat
                                label="Residents & Visitors"
                                dark
                            />-->
                        <v-container fluid>
                            <h3>Age Filters</h3>
                          <v-checkbox
                            hide-details
                              v-model="filterSettings['0-6']"
                              flat
                              label="0-6 years"
                              dark
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['7-17']"
                              flat
                              label="7-17 years"
                              dark
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['18-35']"
                              flat
                              label="18-35 years"
                              dark
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['36-60']"
                              flat
                              label="36-60 years"
                              dark
                          /><v-checkbox
                              hide-details
                              v-model="filterSettings['61-100']"
                              flat
                              label="61-100 years"
                              dark
                          />
                        </v-container>
                        <!--<v-container v-if="!pedestrianModel">
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
                        </v-container>-->
                        <v-btn @click="updateFilter">Apply Filters</v-btn>
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
            <h2>Aggregation Layer Settings</h2>
               <v-range-slider
                    v-model="adjustRange"
                    :min="8"
                    :max="24"
                    hide-details
                    dark
                    class="align-center"
                    @change="changeHeatMapData()"
               >
                    <template v-slot:prepend>
                        <v-text-field
                            :value="adjustRange[0]"
                            class="mt-0 pt-0"
                            hide-details
                            single-line
                            type="number"
                            style="width: 30px"
                            readonly
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
                            readonly
                        ></v-text-field>
                    </template>
               </v-range-slider>
               <div class="heatmap_buttons">
                    <v-tooltip bottom>
                       <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                @click="setHeatMapTimes(8,23)"
                                v-bind="attrs"
                                v-on="on">
                            <v-icon>mdi-av-timer</v-icon>
                        </v-btn>
                        </template>
                            <span>All Day</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                       <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                @click="setHeatMapTimes(8,10)"
                                v-bind="attrs"
                                v-on="on">
                            <v-icon>mdi-weather-sunset-up</v-icon>
                        </v-btn>
                        </template>
                            <span>Morning</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                       <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                @click="setHeatMapTimes(11,15)"
                                v-bind="attrs"
                                v-on="on">
                            <v-icon>mdi-weather-sunny</v-icon>
                        </v-btn>
                        </template>
                            <span>Mid-Day</span>
                    </v-tooltip>
                    <v-tooltip bottom>
                       <template v-slot:activator="{ on, attrs }">
                            <v-btn
                                @click="setHeatMapTimes(17,20)"
                                v-bind="attrs"
                                v-on="on">
                            <v-icon>mdi-weather-sunset-down</v-icon>
                        </v-btn>
                        </template>
                            <span>Evening</span>
                    </v-tooltip>
               </div>
               <p>{{datamsg}}</p>
               <!--<v-btn class="main_btn" @click="heatMapActive">{{ btnlabel }}</v-btn>-->

               <div v-if=(heatMap) class="additional">
                   <div class="additional_options">
                       <template>
                            <v-container fluid>
                                <p>{{ heatMapType || 'null' }}</p>
                                <v-radio-group v-model="heatMapType" :mandatory="true" @change="changeHeatMapData" dark>
                                    <v-radio label="Absolute Data" value="default"></v-radio>
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

    .scenario_box {
        position:relative;
        padding:10px;
        box-sizing: border-box;
        margin:3px auto;

        &:after {
            display:block;
            content:'';
            position:absolute;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background:$darkblue;
            opacity:0.35;
            z-index:-1;
        }

        &.highlight {
            &:after {
                background:$darkred;
            }
        }

        &:hover {
            &:after {
                opacity:0.5;
            }
        }
    }
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
                    color:white;
                }
                .v-input--switch__thumb {
                    background: white;
                    opacity:0.8;
                }
            }
        }
    }

  }
</style>
