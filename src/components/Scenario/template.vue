<script>

    import { mapState } from 'vuex'
    export default {
        name: 'Scenario',
        components: {
        },
        data () {
            return {
                bridge1:  this.$store.state.abmScenario.bridge1,
                bridge2:  this.$store.state.abmScenario.bridge2,
                walkTroughBuildings:  this.$store.state.abmScenario.walkTroughBuildings,
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
                this.$store.commit('updateAbmScenario', {'bridge1': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            bridge2Toggle (evt) {
                this.$store.commit('updateAbmScenario', {'bridge2': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            walkThroughBuildingsToggle (evt) {
                this.$store.commit('updateAbmScenario', {'walkThroughBuildings': evt}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
            },
            pathLayoutToggle (value) {
                console.log(value)
                this.$store.commit('updateAbmScenario', {'pathLayout': value}) // todo: is there a way to avoid this magic string "walkThrougBuildings" ?
                console.log(this.$store.state.abmScenario)
            }
        }
    }
</script>





<template>
  <div>
    <v-row justify="space-around">
      <v-checkbox v-model="disabled" class="mx-2" label="Disabled"></v-checkbox>
      <v-checkbox v-model="readonly" class="mx-2" label="Read-only"></v-checkbox>
      <v-checkbox v-model="error" class="mx-2" label="Error"></v-checkbox>
      <v-checkbox v-model="success" class="mx-2" label="Success"></v-checkbox>
      <v-col cols="12">
        <v-select v-model="color" :items="colors" label="Color"></v-select>
      </v-col>
      <v-col cols="12">
        <header>Checkboxes</header>
      </v-col>
      <v-checkbox v-model="loading" class="mx-2" label="Loading"></v-checkbox>
      <v-checkbox v-model="flat" class="mx-2" label="Flat"></v-checkbox>
      <v-checkbox v-model="inset" class="mx-2" label="Inset"></v-checkbox>
      <v-col cols="12">
        <header>Switches</header>
      </v-col>
      <v-switch v-model="mandatory" class="mx-2" label="Mandatory"></v-switch>
      <v-switch v-model="multiple" class="mx-2" label="Multiple"></v-switch>
      <v-switch v-model="row" class="mx-2" label="Row"></v-switch>
      <v-col cols="12">
        <header>Radios</header>
      </v-col>
      <v-radio-group>
        <v-radio
          v-for="n in 3"
          :key="n"
          :label="`Radio ${n}`"
          :value="n"
        ></v-radio>
      </v-radio-group>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
  #scenario {
    height: 100%;
    width: 100%;
  }
</style>
