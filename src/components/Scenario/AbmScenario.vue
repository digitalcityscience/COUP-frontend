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
        bridge_north (newVal, old) {
            console.log(newVal, old)
        },bridge_south (newVal, old) {
            console.log(newVal, old)
        },
        roof_amenities (newVal, old) {
            console.log(newVal, old)
        }
    },
    mounted () {
        console.log(this.$store)
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
    <div
        id="scenario"
        ref="scenario"
    >
        <v-expansion-panels>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM SCENARIO</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-container fluid>
                        <header class="text-sm-left">
                            CONNECTIVITY
                        </header>
                        <v-switch
                            v-model="bridge_north"
                            flat
                            label="Connection to HafenCity"
                        />
                        <v-subheader class="bridge_subheader">
                            Brigde to Veddel
                        </v-subheader>
                        <v-radio-group v-model="bridge_south">
                            <v-radio
                                :value="bridgeSouthOptions.horizontal"
                                flat
                                label="Horizontal connection to Veddel"
                            />
                            <v-radio
                                :value="bridgeSouthOptions.diagonal"
                                flat
                                label="Diagonal connection to Veddel"
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
                            />
                            <v-radio
                                :value="mainStreetOrientationOptions.vertical"
                                flat
                                label="North-South"
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
                            />
                            <v-radio
                                :value="blockOptions.private"
                                flat
                                label="Private"
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
                            />
                            <v-radio
                                :value="roofAmenitiesOptions.random"
                                flat
                                label="Random"
                            />
                        </v-radio-group>
                    </v-container>
                </v-expansion-panel-content>
                <v-overlay :value="isLoading">
                    <div>Loading ABM results</div>
                    <v-progress-linear>...</v-progress-linear>
                </v-overlay>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM FILTERS</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-container fluid>
                        <v-radio-group v-model="resident_or_visitor">
                            <v-radio
                                :value="filterOptions.resident"
                                flat
                                label="Residents only"
                            />
                            <v-radio
                                :value="filterOptions.visitor"
                                flat
                                label="Visitors only"
                            />
                            <v-radio
                                :value="filterOptions.any"
                                flat
                                label="Residents & Visitors"
                            />
                        </v-radio-group>
                        <v-radio-group v-model="student_or_adult">
                            <v-radio
                                :value="filterOptions.student"
                                flat
                                label="Students only"
                            />
                            <v-radio
                                :value="filterOptions.adult"
                                flat
                                label="Adults only"
                            />
                            <v-radio
                                :value="filterOptions.any"
                                flat
                                label="Students & Adults"
                            />
                        </v-radio-group>
                        <v-switch
                            v-model="foot"
                            flat
                            label="Walking"
                        />
                        <v-switch
                            v-model="bicycle"
                            flat
                            label="Biking"
                        />
                        <v-switch
                            v-model="public_transport"
                            flat
                            label="Public Transport"
                        />
                        <v-switch
                            v-model="car"
                            flat
                            label="Cars"
                        />
                    </v-container>
                </v-expansion-panel-content>
            </v-expansion-panel>
            <v-btn @click="confirmSettings">
                Confirm Settings
            </v-btn>
        </v-expansion-panels>

        <div class="sub" />
    </div>
</template>

<style lang="scss" scoped>
  #scenario {
    height: 100%;
    width: 100%;
  }
  .bridge_subheader {
    height: 5px;
  }
</style>
