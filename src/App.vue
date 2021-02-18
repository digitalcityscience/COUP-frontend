<script>
import Map from './components/Map/Map.vue';
import GFI from './components/GFI/GFI.vue';
import Menu from "./components/Menu/Menu.vue";
import Viewbar from "./components/Menu/Viewbar.vue";
import TimeSheet from "./components/Scenario/TimeSheet.vue";
import Loader from "./components/Loader/Loader.vue";

export default {
    name: 'App',
    components: {
        Map,
        GFI,
        TimeSheet,
        Menu,
        Viewbar,
        Loader
    },
    props: {
      restrictedAccess: Boolean
    },
    computed: {
        cityPyo(){
            return this.$store.state.cityPyO;
        },
        loader(){
            return this.$store.state.loader;
        }
    },
    watch: {
        restrictedAccess(){
            if(!this.restrictedAccess){
                console.log("Full functionality mode")
            } else {
                console.log("Limited functionality mode");
            }
        },
    },
    mounted(){
      console.log("in APP.vue....restricted?", this.restrictedAccess)
        //this.restrictedAccess = this.cityPyo.isUserRestricted()
    },
    created () {
/*   TODO remove this     // automatically connect for public access
        if (this.restrictedAccess) {
          this.$store.dispatch('connect')
        }*/
    }
}
</script>

<template>
  <v-app>
    <Map :restrictedAccess="restrictedAccess"/>
    <Menu :restrictedAccess="restrictedAccess"/>
    <TimeSheet />
    <Viewbar :restrictedAccess="restrictedAccess"/>
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

