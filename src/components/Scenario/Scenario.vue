<script>

    import { mapState } from 'vuex'
    import {verticalPathLayout, horizontalPathLayout} from "@/store/deck-layers";

    export default {
        name: 'Scenario',
        components: {
        },
        data () {
            return {
                verticalPathLayout: verticalPathLayout,
                horizontalPathLayout: horizontalPathLayout,
                bridge1:  this.$store.state.abmScenario.bridge1,
                bridge2:  this.$store.state.abmScenario.bridge2,
                walkTroughBuildings: this.$store.state.abmScenario.walkTroughBuildings,
                pathLayout: this.$store.state.abmScenario.pathLayout,
            }
        },
        computed: {
            ...mapState([
                'selectedFeatures'
            ])
        },
        watch: {
        },
        methods: {
            bridge1Toggle (evt) {
                this.$store.dispatch('updateAbmScenario', {'bridge1': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            bridge2Toggle (evt) {
                this.$store.dispatch('updateAbmScenario', {'bridge2': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            walkThroughBuildingsToggle (evt) {
                this.$store.dispatch('updateAbmScenario', {'walkThroughBuildings': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            pathLayoutToggle (value) {
                console.log(value)
                this.$store.dispatch('updateAbmScenario', {'pathLayout': value}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
                console.log(this.$store.state.abmScenario)
            }
        }
    }
</script>

<template>
  <div id="scenario" ref="scenario">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-header>ABM Scenario</v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-container fluid>
            <header class="text-sm-left">Bridges</header>
            <v-switch v-on:change="bridge1Toggle" v-model="bridge1" flat :label="`Bridge 1`"></v-switch>
            <v-switch v-on:change="bridge2Toggle" v-model="bridge2" flat :label="`Bridge 2`"></v-switch>

            <header class="text-sm-left">Walking through buildings?</header>
            <v-switch v-on:change="walkThroughBuildingsToggle" v-model="walkTroughBuildings" flat :label="`Walk trough buildings: ${walkTroughBuildings.toString()}`"></v-switch>

            <header class="text-sm-left">Pathways</header>
            <v-radio-group>
              <v-radio v-on:change="pathLayoutToggle(horizontalPathLayout)"
                       :label="'Horizontal pathways'"
                       :value="pathLayout == horizontalPathLayout"
              ></v-radio>
              <v-radio v-on:change="pathLayoutToggle(verticalPathLayout)"
                       :label="'Vertical pathways'"
                       :value="pathLayout == verticalPathLayout"
              ></v-radio>
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
