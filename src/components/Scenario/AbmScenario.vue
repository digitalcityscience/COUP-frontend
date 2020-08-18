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
import TimeSheet from '@/components/Scenario/TimeSheet.vue'

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
            age: 21
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
        ])
    },
    watch: {
        car (newVal, old) {
            console.log(newVal, old)
        },
        roof_amenities (newVal, old) {
            console.log(newVal, old)
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
                            v-model="bridge_north"
                            flat
                            label="Connection to HafenCity"
                            dark
                        />
                        <v-subheader class="bridge_subheader" dark>
                            Brigde to Veddel
                        </v-subheader>
                        <v-radio-group v-model="bridge_south">
                            <v-radio
                                :value="bridgeSouthOptions.horizontal"
                                flat
                                label="Horizontal connection to Veddel"
                                dark
                            />
                            <v-radio
                                :value="bridgeSouthOptions.diagonal"
                                flat
                                label="Diagonal connection to Veddel"
                                dark
                            />
                        </v-radio-group>
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
                          AMENITY DISTRIBUTION
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
