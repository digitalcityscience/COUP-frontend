<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import {
    bridges,
    moduleSettingNames,
    bridgeSouthOptions,
    mainStreetOrientationOptions,
    blockPermeabilityOptions,
    roofAmenitiesOptions,
    filters,
    filterOptions
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
            bridgeSouthOptions: bridgeSouthOptions,
            mainStreetOrientationOptions: mainStreetOrientationOptions,
            blockOptions: blockPermeabilityOptions,
            roofAmenitiesOptions: roofAmenitiesOptions,
            filters: filters,
            filterOptions: filterOptions,
            age: 21,
            timePaths: {},
            weightData:[],
            weightObjData:[],
            timeRange:[0, 54000],
            adjustRange:[8, 23],
            datamsg:'',
            heatMapType:'average',
            btnlabel: 'Generate Aggregation Layer',
            origins:[],
            changesMade: false
        }
    },
    computed: {
        ...mapState(['selectedFeatures']),
        ...mapState('scenario', ['isLoading']), // getter only
        // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
        ...generateStoreGetterSetter([
            ['bridge_north', 'scenario/moduleSettings/' + moduleSettingNames.bridge_north],
            ['bridge_south', 'scenario/moduleSettings/' + moduleSettingNames.bridge_south],
            ['main_street_orientation', 'scenario/moduleSettings/' + moduleSettingNames.mainStreetOrientation],
            ['blocks', 'scenario/moduleSettings/' + moduleSettingNames.blocks],
            ['roof_amenities', 'scenario/moduleSettings/' + moduleSettingNames.roofAmenities],
            ['student_or_adult', 'scenario/scenarioViewFilters/' + filters.student_or_adult],
            ['resident_or_visitor', 'scenario/scenarioViewFilters/' + filters.resident_or_visitor],
            ['foot', 'scenario/scenarioViewFilters/modes/' + filterOptions.foot],
            ['bicycle', 'scenario/scenarioViewFilters/modes/' + filterOptions.bicycle],
            ['public_transport', 'scenario/scenarioViewFilters/modes/' + filterOptions.public_transport],
            ['car', 'scenario/scenarioViewFilters/modes/' + filterOptions.car],
        ]),
        abmData(){
            return this.$store.state.scenario.abmData;
        },
        heatMap(){
            return this.$store.state.scenario.heatMap;
        }
    },
    watch: {
        car (newVal, old) {
            //console.log(newVal, old)
        },
        roof_amenities (newVal, old) {
            //console.log(newVal, old)
        },
        abmData() {
            this.updateData();
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
        confirmSettings () {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenario'
            )
        },
        /*retransformating abmData fitting for TimeMap*/
        /*cluster Time Stamp Data for rounded full hours*/
        clusterTimeData(){
            if (this.abmData) {
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
        checkChanges(){
            if(
                this.origins[0] == this.bridge_north &&
                this.origins[1] == this.bridge_south &&
                this.origins[2] == this.main_street_orientation &&
                this.origins[3] == this.blocks &&
                this.origins[4] == this.roof_amenities) {
                    this.changesMade = false;
                } else {
                    this.changesMade = true;
                }
        },
        updateData(){
          this.origins[0] = this.bridge_north;
          this.origins[1] = this.bridge_south;
          this.origins[2] = this.main_street_orientation;
          this.origins[3] = this.blocks;
          this.origins[4] = this.roof_amenities
          this.changesMade = false;
          this.clusterTimeData();
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
               <h2>ABM Scenario Settings</h2>
                <v-container fluid>
                        <header class="text-sm-left">
                            BRIDGES
                        </header>
                        <v-switch
                            v-model="bridge_north"
                            flat
                            label="Bridge to HafenCity"
                            dark
                            @change="checkChanges"
                            :color="origins[0] != bridge_north ? '#FD805D' : '#888'"
                            :class="origins[0] != bridge_north ? 'switched' : 'na'"
                        />
                        <v-radio-group v-model="bridge_south" :class="origins[1] != bridge_south ? 'switched' : 'na'">
                            <v-radio
                                :value="bridgeSouthOptions.horizontal"
                                flat
                                label="Bridge to S Veddel (South)"
                                dark
                                @change="checkChanges"
                                :color="origins[1] != bridge_south ? '#FD805D' : '#888'"
                            />
                            <v-radio
                                :value="bridgeSouthOptions.diagonal"
                                flat
                                label="Bridge to S Veddel (North)"
                                dark
                                @change="checkChanges"
                                :color="origins[1] != bridge_south ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            MAIN STREET ORIENTATION
                        </header>
                        <v-radio-group v-model="main_street_orientation" :class="origins[2] != main_street_orientation ? 'switched' : 'na'">
                            <v-radio
                                :value="mainStreetOrientationOptions.vertical"
                                flat
                                label="North-South Axes"
                                    dark
                                @change="checkChanges"
                                :color="origins[2] != main_street_orientation ? '#FD805D' : '#888'"
                            />
                            <v-radio
                                :value="mainStreetOrientationOptions.horizontal"
                                flat
                                label="East-West Axes"
                                dark
                                @change="checkChanges"
                                :color="origins[2] != main_street_orientation ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                          CITY BLOCK STRUCTURE
                        </header>
                        <v-radio-group v-model="blocks" :class="origins[3] != blocks ? 'switched' : 'na'">
                            <v-radio
                                :value="blockOptions.open"
                                flat
                                label="Permeable"
                                dark
                                @change="checkChanges"
                                :color="origins[3] != blocks ? '#FD805D' : '#888'"

                            />
                            <v-radio
                                :value="blockOptions.closed"
                                flat
                                label="Private"
                                dark
                                @change="checkChanges"
                                :color="origins[3] != blocks ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                          AMENITY DISTRIBUTION
                        </header>
                        <v-radio-group v-model="roof_amenities" :class="origins[4] != roof_amenities ? 'switched' : 'na'">
                            <v-radio
                                :value="roofAmenitiesOptions.complementary"
                                flat
                                label="Clustered by Type"
                                dark
                                @change="checkChanges"
                                :color="origins[4] != roof_amenities ? '#FD805D' : '#888'"
                            />
                            <v-radio
                                :value="roofAmenitiesOptions.random"
                                flat
                                label="Mixed Distribution"
                                dark
                                @change="checkChanges"
                                :color="origins[4] != roof_amenities ? '#FD805D' : '#888'"
                            />
                        </v-radio-group>
                    </v-container>

                    <v-btn @click="confirmSettings" class="confirm_btn" :class="{ changesMade : changesMade }">
                      Run Scenario
                    </v-btn>

                    <v-overlay :value="isLoading">
                        <div>Loading results</div>
                        <v-progress-linear>...</v-progress-linear>
                    </v-overlay>
           </div><!--component_content end-->
        </div><!--division end-->

        <div class="division" data-title='Filter' data-pic='mdi-filter'>
            <div v-if="activeDivision === 'Filter'" class="component_content">

            <h2>ABM Scenario Filters</h2>
            <v-container fluid>
                        <v-radio-group v-model="resident_or_visitor">
                            <v-radio
                                :value="filterOptions.resident"
                                flat
                                label="Residents only"
                                dark
                            />
                            <v-radio
                                :value="filterOptions.visitor"
                                flat
                                label="Visitors only"
                                dark
                            />
                            <v-radio
                                :value="filterOptions.any"
                                flat
                                label="Residents & Visitors"
                                dark
                            />
                        </v-radio-group>
                        <v-radio-group v-model="student_or_adult">
                            <v-radio
                                :value="filterOptions.student"
                                flat
                                label="Students only"
                                dark
                            />
                            <v-radio
                                :value="filterOptions.adult"
                                flat
                                label="Adults only"
                                dark
                            />
                            <v-radio
                                :value="filterOptions.any"
                                flat
                                label="Students & Adults"
                                dark
                            />
                        </v-radio-group>
                        <v-switch
                            v-model="foot"
                            flat
                            label="Walking"
                            dark
                        />
                        <v-switch
                            v-model="bicycle"
                            flat
                            label="Biking"
                            dark
                        />
                        <v-switch
                            v-model="public_transport"
                            flat
                            label="Public Transport"
                            dark
                        />
                        <v-switch
                            v-model="car"
                            flat
                            label="Cars"
                            dark
                        />
                    </v-container>

                    <v-btn @click="confirmSettings" class="confirm_btn">
                        Run Scenario
                    </v-btn>

                    <v-overlay :value="isLoading">
                        <div>Loading ABM results</div>
                        <v-progress-linear>...</v-progress-linear>
                    </v-overlay>
            </div>
        </div>

        <div class="division" data-title='Heatmap' data-pic='mdi-gauge'>
           <div v-if="activeDivision === 'Heatmap'" class="component_content">
            <h2>Capacity Use Map</h2>
               <v-range-slider
                    v-model="adjustRange"
                    :min="6"
                    :max="21"
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

  #scenario {
    height: 100%;
    width: 100%;

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
