<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import {
    designScenarios,
    moduleSettingNames,
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
            designScenarioNames: designScenarios,
            moduleSettingOptions: moduleSettingNames,
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
            adjustRange:[6, 21],
            datamsg:'',
            btnlabel: 'Generate Aggregation Layer'
        }
    },
    computed: {
        ...mapState(['selectedFeatures']),
        ...mapState('scenario', ['isLoading']), // getter only
        // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
        ...generateStoreGetterSetter([
            ['bridge_1', 'scenario/moduleSettings/' + moduleSettingNames.bridge_1],
            ['bridge_2', 'scenario/moduleSettings/' + moduleSettingNames.bridge_2],
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
        abmData(){
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
        clusterTimeData(){
            if (this.abmData) {
                this.abmData.forEach((v,i,a) => {
                    v.timestamps.forEach((vv,ii,aa) => {
                       var h = Math.floor(vv / 3600) + 6;
                       this.timePaths[h] = this.timePaths[h] || [];
                       this.timePaths[h].push(v.path[ii]);
                    });
                });

                this.timePaths = Object.values(this.timePaths).map(arr => {
                    
                    let weightCount = {};

                    const newArr = arr.map(value => {
                        return value.join()
                    }).sort().forEach(value => {
                        weightCount[value] = (weightCount[value] +1)  ||  1;
                    });

                    const objArr = weightCount;
                    return objArr;
                });
            }
            
        },
        changeHeatMapData(range){
            if(this.heatMap){
                this.getWeightData(range);
            }
        },
        getWeightData(range) {
            this.weightData = [];
            this.weightObjData = [];
            console.log("weightData starts");
            console.log(range);

            if(this.abmData) {
                this.datamsg = "ABM Data loaded";
                
                let filterTimeObj = Object.assign({},this.timePaths);
                
                console.log(filterTimeObj);

                let timeCoordData = {};

                for (const [key, value] of Object.entries(filterTimeObj)) {
                    key = `${key}`;
                    value = `${value}`;

                    if(key >= range[0] - 6 && key <= range[1] - 6) {
                        for (const [coord, weight] of Object.entries(filterTimeObj[key])) {
                            coord = `${coord}`;
                            weight = `${weight}`;
                            
                            timeCoordData[coord] = + weight || weight;
                        };
                    } else {
                        delete filterTimeObj[key];
                    }
                }

                var finalDataSet = [];

                for(const [key, value] of Object.entries(timeCoordData)) {
                    key = `${key}`;
                    value = `${value}`;

                    let int = parseInt(value);
                    let coordinate = { Coordinates: key.split(",").map(Number), Weight: int};
                    finalDataSet.push(coordinate);
                }

                this.$store.commit("scenario/heatMapData", finalDataSet);
                console.log(finalDataSet);

             } else {
                this.datamsg = "No ABM Data loaded";
            }

        },
        heatMapActive(){
            this.$store.commit("scenario/heatMap", !this.heatMap);

            if(this.heatMap){
                this.getWeightData(this.adjustRange);
            }
        },
        /*setTimeRange(range){
            const adjustTime = range.map(x => (x - 6) * 3600);

            this.timeRange = adjustTime;
            this.getWeightData(this.timeRange);
        },*/
        updateData(){
            this.clusterTimeData();
        }
    }
}
</script>

<template>
    <div id="scenario" ref="scenario">
        <div class="component_divisions">
            <ul>
                <li v-for="division in componentDivisions" :key="division.title" v-bind:class="{ highlight: activeDivision === division.title }">
                    <div class="component_link" @click="activeDivision = division.title">
                        <v-icon>{{division.pic}}</v-icon>
                    </div>
                    <div class="toHover">{{division.title}}</div>
                </li>
            </ul>
        </div>

        <div class="division" data-title='Scenario' data-pic='mdi-map-marker-radius'>
           <div v-if="activeDivision === 'Scenario'" class="component_content">
               <h2>ABM Scenario Settings</h2>
                <v-container fluid>
                        <header class="text-sm-left">
                            CONNECTIVITY
                        </header>
                        <v-switch
                            v-model="bridge_1"
                            flat
                            label="Bridge 1"
                            dark
                        />
                        <v-switch
                            v-model="bridge_2"
                            flat
                            label="Bridge 2"
                            dark
                        />
                        <header class="text-sm-left">
                            MAIN STREET
                        </header>
                        <v-radio-group v-model="main_street_orientation">
                            <v-radio
                                :value="mainStreetOrientationOptions.horizontal"
                                flat
                                label="East-West"
                                dark
                            />
                            <v-radio
                                :value="mainStreetOrientationOptions.vertical"
                                flat
                                label="North-South"
                                dark
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            BLOCKS
                        </header>
                        <v-radio-group v-model="blocks">
                            <v-radio
                                :value="blockOptions.permeable"
                                flat
                                label="Permeable"
                                dark
                            />
                            <v-radio
                                :value="blockOptions.private"
                                flat
                                label="Private"
                                dark
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            ROOF AMENITIES
                        </header>
                        <v-radio-group v-model="roof_amenities">
                            <v-radio
                                :value="roofAmenitiesOptions.complementary"
                                flat
                                label="Complementary"
                                dark
                            />
                            <v-radio
                                :value="roofAmenitiesOptions.random"
                                flat
                                label="Random"
                                dark
                            />
                        </v-radio-group>
                    </v-container>

                    <v-btn @click="confirmSettings" class="confirm_btn">
                        Confirm Settings
                    </v-btn>

                    <v-overlay :value="isLoading">
                        <div>Loading ABM results</div>
                        <v-progress-linear>...</v-progress-linear>
                    </v-overlay>
           </div>
        </div>

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
                        Confirm Settings
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
                   <p>I am visible</p>
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
  }
</style>
