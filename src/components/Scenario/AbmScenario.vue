<script>

import { mapState } from 'vuex'
import {designScenarios, pathWaySettings, moduleSettings }  from '@/store/abm.ts';


export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
            designScenarios: designScenarios,
            pathWaySettings: pathWaySettings,
            scenarioDetails: this.$store.state.abmScenario,
        }
    },
    computed: {
        ...mapState([
            'selectedFeatures'
        ])
    },
    watch: {},
    methods: {
        designScenarioToggle (scenarioName) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenario',
                { scenarioName } // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            )
        },
        walkThroughBuildingsToggle (evt) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                { walkThroughBuildings: evt }
            )
        },
        pathLayoutToggle (value) {
            this.$store.dispatch(
                'scenario/updateAbmDesignScenarioSettings',
                { pathLayout: value } // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
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
                <v-expansion-panel-header>ABM Scenario</v-expansion-panel-header>
                <v-expansion-panel-content>
                    <v-container fluid>
                        <header class="text-sm-left">
                            Bridges
                        </header>
                        <v-radio-group>
                            <v-radio
                                flat
                                :label="`Bridge 1`"
                                @change="designScenarioToggle(designScenarios.bridge1)"
                            />
                            <v-radio
                                flat
                                :label="`Bridge 2`"
                                @change="designScenarioToggle(designScenarios.bridge2)"
                            />
                            <v-radio
                                flat
                                :label="`Bridge 1 & 2`"
                                @change="designScenarioToggle(designScenarios.all_bridges)"
                            />
                        </v-radio-group>
                        <header class="text-sm-left">
                            Walking through buildings?
                        </header>
                        <v-switch
                            flat
                            :label="`Walk trough buildings: ${scenarioDetails.moduleSettings.walkThroughBuildings.toString()}`"
                            @change="walkThroughBuildingsToggle"
                        />
                        <header class="text-sm-left">
                            Pathways
                        </header>
                        <v-radio-group>
                            <v-radio
                                flat

                                :label="'Horizontal pathways'"
                                @change="pathLayoutToggle(pathWaySettings.horizontalPathways)"
                            />
                            <v-radio
                                flat
                                :label="'Vertical pathways'"
                                @change="pathLayoutToggle(pathWaySettings.verticalPathways)"
                            />
                        </v-radio-group>
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
