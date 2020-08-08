<script>
import { mapState } from 'vuex';
import {abmTripsLayerName, buildTripsLayer, animate} from "@/store/deck-layers";

export default {
    name: 'TimeSheet',
    data() {
        return {
            currentTimeSet: 0,
            currentTimeStamp: 0,
        }
    },
    components: {},
    methods:{
        getScenarioData(){
            this.currentTimeSet = tripsLayer.currentTime;
        },
    },
    computed: {
        getTimeStamp(){

        }
    }
}

</script>

<template>
    <div id="timesheet">
        <h3>TimeSheet</h3>
        <v-btn large @click="getScenarioData">Get Data</v-btn>
        <p>Show me this value <br/>
        <strong>{{currentTimeSet}}</strong></p>
    </div>
</template>
<style scoped lang="scss">
    
</style>