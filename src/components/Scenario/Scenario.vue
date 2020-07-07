<script>
    import { mapState } from 'vuex'
    export default {
        name: 'Scenario',
        components: {
        },
        data () {
            return {
                switch1: true,
                switch2: false,
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
        }
    }
</script>

<template>
  <div id="scenario" ref="scenario">
    <template>
      <v-sheet color="grey lighten-3" width="100%" height="100%" class="pa-12">
        <v-switch v-model="switch1" flat :label="`Switch 1: ${switch1.toString()}`"></v-switch>
        <v-switch v-model="switch2" flat :label="`Switch 2: ${switch2.toString()}`"></v-switch>
      </v-sheet>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  #scenario {
    height: 100%;
    width: 100%;
  }
</style>
