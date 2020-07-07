<script>
import Map from './components/Map/Map.vue'
import GFI from './components/GFI/GFI.vue'
import Scenario from "@/components/Scenario/Scenario";
import { mapGetters } from 'vuex'

export default {
    name: 'App',
    components: {
        Map,
        GFI,
        Scenario
    },
    computed: {
    },
    watch: {
    },
    created () {
        this.$store.dispatch('connect', {
            userdata: {
                username: 'ernie',
                password: 'bert'
            }
        })
    }
}
</script>

<template>
    <v-app>
        <Map />
        <GFI />
        <Scenario />
    </v-app>
</template>

<style lang="scss">
    #app {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
    }
</style>
