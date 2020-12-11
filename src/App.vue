<script>
import Map from './components/Map/Map.vue';
import GFI from './components/GFI/GFI.vue';
import Scenario from "@/components/Scenario/AbmScenario";
import Menu from "./components/Menu/Menu.vue";
import Viewbar from "./components/Menu/Viewbar.vue";
import TimeSheet from "./components/Scenario/TimeSheet.vue";
import Loader from "./components/Loader/Loader.vue";
import { mapGetters } from 'vuex';

export default {
    name: 'App',
    components: {
        Map,
        GFI,
        Scenario,
        TimeSheet,
        Menu,
        Viewbar,
        Loader
    },
    computed: {
        workshop(){
            return this.$store.state.workshop;
        },
        loader(){
            return this.$store.state.loader;
        }
    },
    watch: {
        workshop(){
            if(!this.workshop){
                console.log("URL does not include workshop")
            } else {
                console.log("Url does include workshop");
            }
        },
        loader(){
            console.log("something is happening with me", this.loader);
        }
    },
    mounted(){
        console.log("i am loaded", this.loader);
        this.$store.dispatch('checkoutWorkshop');
        this.$on('showLoader', this.displayLoader(true));
        this.$on('hideLoader', this.displayLoader(false));
    },
    created () {
        this.$store.dispatch('connect', {
            userdata: {
                username: 'ernie',
                password: 'bert'
            }
        });
    },
    methods:{
        displayLoader(status){
            console.log("i am triggering", status);
        }
    },
}
</script>

<template>
    <v-app>
        <Map />
        <GFI />
        <Menu />
        <TimeSheet />
        <Viewbar />
        <Loader />
        <div id="line_canvas"></div>
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

    Map, GFI, TimeSheet {
        z-index:2;
    }

    Loader {
        z-index:5;
    }

    Menu, Viewbar {
        z-index:7;
    }

    .v-application p {
        margin-bottom:0px;
    }

    #line_canvas {
        position:fixed;
        top:0;
        left:0;
        /*width:100vw;
        height:100vh;*/
        z-index:2;
        background:transparent;;
        pointer-events:none;
    }

    
</style>

