<script>
import { mapState } from 'vuex'
import AbmScenario from "@/components/Scenario/AbmScenario.vue";
import SWScenario from "@/components/Scenario/SWScenario.vue";
import MCScenario from "@/components/Scenario/MCScenario.vue";
import NoiseScenario from "@/components/Scenario/NoiseScenario.vue";

export default {
    name: 'Menu',
    components: {AbmScenario, SWScenario, MCScenario, NoiseScenario},
    data() {
        return {
            activeComponent: 'AbmScenario'
        }
    },
    mounted(){
    },
    methods:{
    }
}
</script>

<template>
    <div id="menu">
        <div class="header_scope">
            <h3>Grasbrook CityScope</h3>
            <p>Tool for Functional Planning</p>
        </div>
        <div class="component_switch">
            <ul class="component_list">
                <li class="component_link" v-bind:class="{ highlight: activeComponent === 'AbmScenario' }" @click="activeComponent = 'AbmScenario'"><p>ABM</p></li>
                <li class="component_link" v-bind:class="{ highlight: activeComponent === 'SWScenario' }" @click="activeComponent = 'SWScenario'"><p>Stormwater</p></li>
                <li class="component_link" v-bind:class="{ highlight: activeComponent === 'MCScenario' }" @click="activeComponent = 'MCScenario'"><p>Microclimate</p></li>
                <li class="component_link" v-bind:class="{ highlight: activeComponent === 'NoiseScenario' }" @click="activeComponent = 'NoiseScenario'"><p>Noise</p></li>
            </ul>
        </div>
        <div class="body_scope">
            <div v-if="activeComponent === 'AbmScenario'"><AbmScenario /></div>
            <div v-if="activeComponent === 'SWScenario'"><SWScenario /></div>
            <div v-if="activeComponent === 'MCScenario'"><MCScenario /></div>
            <div v-if="activeComponent === 'NoiseScenario'"><NoiseScenario /></div>
        </div>
        <div class="footer_scope">

        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    #menu {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        transform:translateX(100%);
        border-left:1px solid #888;
        font-family: 'Tajawal', sans-serif;
        z-index: 1000;

        .header_scope {
            h3 {
                width:100%;
                padding: 10px 20px 0px 20px;
                box-sizing:border-box;
                text-align:left;
                font-size:110%;
                color:$bright1;
            }
            p {
                width:100%;
                padding:0px 20px 10px 20px;
                box-sizing:border-box;
                text-align:left;
                font-size:90%;
                color:$bright2;
            }
        }

        .component_switch {
            width:100%;

            .component_list {
                display: flex;
                flex-flow: row wrap;
                justify-content: flex-start;
                list-style: none;
                padding: 0;
                width: 90%;
                margin: auto;

                .component_link {
                    position:relative;
                    height: 30px;
                    line-height: 30px;
                    padding: 0px 20px;
                    box-sizing: border-box;
                    margin: 3px;
                    text-align: center;

                    p {
                        color:$bright1;
                        font-size:80%;
                    }

                    &:after {
                        background: $reversed;
                        opacity:0.35;
                        z-index:-1;
                        @include fullpseudo;
                    }

                    &:hover {
                        cursor:pointer;

                        &:after {
                            opacity:0.5;
                        }
                    }

                    &.highlight {
                        outline:1px solid $bright1;

                        &:after {
                            opacity:0.65;
                        }
                    }
                }
            }
        }

        .body_scope {}
        .footer_scope {}

        @media(min-device-width:1024px){
            right:0;
            left:auto;
            width:30vw;
            max-width:340px;
            transform:translateX(0);
            background:rgba(0,0,0,0.8);
        }
    }
</style>
