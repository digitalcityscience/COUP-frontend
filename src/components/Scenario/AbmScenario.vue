<script>

import { mapState } from 'vuex'
import {
    designScenarios,
    mainStreetOrientationOptions,
    blockPermeabilityOptions,
    roofAmenitiesOptions,
    filters,
    filterOptions
} from '@/store/abm.ts'


export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
            designScenarios: designScenarios,
            mainStreetOrientation: mainStreetOrientationOptions,
            blockOptions: blockPermeabilityOptions,
            roofAmenitiesOptions: roofAmenitiesOptions,
            filters: filters,
            filterOptions: filterOptions
        }
    },
    computed: {
        ...mapState([
            'selectedFeatures'
        ])
    },
    watch: {},
    methods: {
        bridge1Toggle (evt) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                { bridge_1: evt }
            )
        },
        bridge2Toggle (evt) {
             this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                { bridge_2: evt }
            )
        },
        openBlocks (value) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                { blocks: value }
            )
        },
        mainStreet (value) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                // eslint-disable-next-line @typescript-eslint/camelcase
                { main_street_orientation: value }
            )
        },
        roofAmenities (value) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                // eslint-disable-next-line @typescript-eslint/camelcase
                { roof_amenities: value }
            )
        },
        updateFilter (key, value) {
            this.$store.dispatch(
                'scenario/updateAbmDataFilter',
                // eslint-disable-next-line @typescript-eslint/camelcase
                { [key]: value }
            )
        },
        updateModeFilter (mode, evt) {
            this.$store.dispatch(
                'scenario/updateAbmDataModeFilter',
                // eslint-disable-next-line @typescript-eslint/camelcase
                { [mode]: evt }
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
        <!-- TODO : connect radios and toggles to v-model!!! -->
        <v-expansion-panels>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM SCENARIO</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-container fluid>
                        <header class="text-sm-left">
                            CONNECTIVITY
                        </header>
                        <v-switch
                            flat
                            :label="`Bridge 1`"
                            @change="bridge1Toggle"
                        />
                        <v-switch
                            flat
                            :label="`Bridge 2`"
                            @change="bridge2Toggle"
                        />
                        <header class="text-sm-left">
                            MAIN STREET
                        </header>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="'East-West'"
                                @change="mainStreet(mainStreetOrientation.horizontal)"
                            />
                            <v-radio
                                flat
                                :label="'North-South'"
                                @change="mainStreet(mainStreetOrientation.vertical)"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            BLOCKS
                        </header>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="'Permeable'"
                                @change="openBlocks(blockOptions.permeable)"
                            />
                            <v-radio
                                flat
                                :label="'Private'"
                                @change="openBlocks(blockOptions.private)"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            ROOF AMENITIES
                        </header>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="'Complementary'"
                                @change="roofAmenities(roofAmenitiesOptions.complementary)"
                            />
                            <v-radio
                                flat
                                :label="'Random'"
                                @change="roofAmenities(roofAmenitiesOptions.random)"
                            />
                        </v-radio-group>
                    </v-container>
                </v-expansion-panel-content>
            </v-expansion-panel>
            <v-expansion-panel>
                <v-expansion-panel-header>ABM FILTERS</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-container fluid>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="`Residents only`"
                                @change="updateFilter(filters.resident_or_visitor, filterOptions.resident)"
                            />
                            <v-radio
                                flat
                                :label="`Visitors only`"
                                @change="updateFilter(filters.resident_or_visitor, filterOptions.visitor)"
                            />
                            <v-radio
                                flat
                                :label="`Residents & Visitors`"
                                @change="updateFilter(filters.resident_or_visitor, '')"
                            />
                        </v-radio-group>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="`Students only`"
                                @change="updateFilter(filters.student_or_adult, filterOptions.student)"
                            />
                            <v-radio
                                flat
                                :label="`Adults only`"
                                @change="updateFilter(filters.student_or_adult, filterOptions.adult)"
                            />
                            <v-radio
                                flat
                                :label="`Students & Adults`"
                                @change="updateFilter(filters.student_or_adult, '')"
                            />
                        </v-radio-group>
                        <v-switch
                            flat
                            :label="`Walking`"
                            @change="updateModeFilter(filterOptions.foot, $event)"
                        />
                        <v-switch
                            flat
                            :label="`Biking`"
                            @change="updateModeFilter(filterOptions.bicycle, $event)"
                        />
                        <v-switch
                            flat
                            :label="`Public Transport`"
                            @change="updateModeFilter(filterOptions.public_transport, $event)"
                        />
                        <v-switch
                            flat
                            :label="`Cars`"
                            @change="updateModeFilter(filterOptions.car, $event)"
                        />
                    </v-container>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>

<style lang="scss" scoped>
  #scenario {
    height: 100%;
    width: 100%;
  }
</style>
