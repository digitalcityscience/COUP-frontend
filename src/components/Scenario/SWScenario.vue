<script>

import { mapState } from 'vuex'
import { generateStoreGetterSetter } from '@/store/utils/generators.ts'
import Junctions from '@/config/nodes.json'
import Subcatchments from '@/config/subcatchments.json'
import Pipes from '@/config/links.json'
import Rain from '@/config/rain.json'
import { swLayerName } from "@/store/deck-layers";
import CityPyo from "@/store/cityPyO";

export default {
    name: 'AbmScenario',
    components: {},
    data () {
        return {
            dummyObject: {},
            rainAmount: "2yr",
            rainTime:"test",
        }
    },
    computed:{
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'layers',
            'layerIds',
        ]),
        stormWater(){
            return this.$store.state.scenario.stormWater;
        },
        swData(){
            return this.$store.state.scenario.swData;
        }
    },
    watch: {
        swData(){
            this.$store.dispatch('scenario/addSWLayer',  this.swData);
        },
    },
    methods: {
        async getStormWaterResult() {
          // todo create an action for this
          const scenario_hash = "xyz123"
          const resultLayer = await this.$store.state.cityPyO.getStormwaterResultLayerSource(scenario_hash)
          console.log("got stormwater result layer source")
          console.log("add me to the map")
          console.log(resultLayer)
        },
        activateStormWater(){
            this.generateDummyData("2yr");
            this.$store.commit("scenario/rainAmount", Rain['2yr']);
            this.$store.commit("scenario/stormWater", true);
            this.$store.commit("scenario/selectGraph", "sw");
        },
        generateDummyData(storm){
            this.dummyObject = {};
            Subcatchments.features.forEach(feature => {
                if(feature.properties.city_scope != null){
                    this.dummyObject[feature.properties.city_scope] = {};
                    this.dummyObject[feature.properties.city_scope].type = feature.properties.S_Type;
                    this.dummyObject[feature.properties.city_scope].roof = feature.properties.Roof_Type;
                    this.dummyObject[feature.properties.city_scope].geometry = feature.geometry.coordinates.flat(1);
                    this.dummyObject[feature.properties.city_scope].runoff =[];

                    for(var i = 0; i < 288; i++){
                        let hour;
                        prev ? prev = prev : prev = 1;
                        i != 0 ? hour = Math.floor(i/12) : hour = 0;
                        let runoff = this.getRandomDummyValue(prev, Rain[storm][hour]);
                        var prev = runoff;
                        this.dummyObject[feature.properties.city_scope].runoff.push(runoff);
                    }
                }
            });

            console.log(this.dummyObject);
            this.$store.commit("scenario/swData", this.dummyObject);
        },
        getRandomDummyValue(min,max){
            let maxR; let minR;
            if(min > max){ maxR = min; minR = max } else { maxR = max; minR = min };
            return Math.floor(Math.random() * (maxR - minR + 1) + minR);
        },
        changeRain(rain){
            this.rainAmount = rain;
            this.generateDummyData(rain);
            this.$store.commit("scenario/rainAmount", Rain[rain]);
        },
    },
}

</script>

<template>
    <div class="component_body">
        <p>Display Stormwater Scenarios</p>
        <div v-if="!stormWater" class="sw_button" @click="activateStormWater">
            Load SW Data
        </div>
        <div v-if="stormWater" class="sw_dashboard">
            <div class="storm_selection">
                <v-btn @click="changeRain('2yr')" :class="{ disabled: rainAmount == '2yr' }">2 year Event</v-btn>
                <v-btn @click="changeRain('10yr')" :class="{ disabled: rainAmount == '10yr'}">10 year Event</v-btn>
                <v-btn @click="changeRain('100yr')" :class="{ disabled: rainAmount == '100yr'}">100 year Event</v-btn>
            </div>
        </div>
        <div>
          <v-btn @click="getStormWaterResult()" :class="{ disabled: false}">GET RESULT</v-btn>
        </div>

    </div>
</template>



<style scoped lang="scss">
    @import "../../style.main.scss";

    .sw_button {
        display:block;
        width:100%;
        margin:10px auto;
        height:40px;
        background:$reversed;
        color:whitesmoke;
        text-align:center;
        line-height:40px;
    }

    .sw_dashboard {
        .storm_selection {
            .v-btn {

                    opacity:1;
                    pointer-events:all;
                &.disabled {
                    opacity:0.5;
                    pointer-events:none;
                }
            }
        }

        .load_vis {
            display:block;
            width:100%;
            height:40px;
            background:$reversed;
            color:whitesmoke;
            line-height:40px;
            margin:10px auto;
            @include drop_shadow;
        }

    }
</style>
