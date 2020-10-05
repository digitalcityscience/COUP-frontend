<script>
import Map from './components/Map/Map.vue';
import GFI from './components/GFI/GFI.vue';
import Scenario from "@/components/Scenario/AbmScenario";
import Menu from "./components/Menu/Menu.vue";
import Viewbar from "./components/Menu/Viewbar.vue";
import TimeSheet from "./components/Scenario/TimeSheet.vue";
import { mapGetters } from 'vuex';

export default {
    name: 'App',
    components: {
        Map,
        GFI,
        Scenario,
        TimeSheet,
        Menu,
        Viewbar
    },
    computed: {
        workshop(){
            return this.$store.state.workshop;
        },
    },
    watch: {
        workshop(){
            if(!this.workshop){
                console.log("URL does not include workshop")
            } else {
                console.log("Url does include workshop");
            }
        },
    },
    mounted(){
        this.$store.dispatch('checkoutWorkshop')
    },
    created () {
        this.$store.dispatch('connect', {
            userdata: {
                username: 'ernie',
                password: 'bert'
            }
        });
    }
}
</script>

<template>
    <v-app>
        <Map />
        <GFI />
        <Menu />
        <TimeSheet />
        <Viewbar />
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

    .v-application p {
        margin-bottom:0px;
    }
</style>
