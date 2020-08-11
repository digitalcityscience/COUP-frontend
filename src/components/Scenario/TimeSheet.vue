<script>
import { mapState } from 'vuex';
import Chart from 'chart.js'
import {abmTripsLayerName, buildTripsLayer, animate} from "@/store/deck-layers";

export default {
    name: 'TimeSheet',
    data() {
        return {
            currentTimeSet: 0,
            currentTimeStamp: 0,
            currentValue:0,
            animationSpeed: 7,
            timeArray: {},
            timeStamps: [],
            timeCoords: [],
            minTime: 0,
            maxTime: 0,
        }
    },
    mounted(){
    },
    updated(){
        //this.renderTimeGraph();
    },
    components: {},
    methods:{
        triggerAnimation(){
            const animationRunning = this.$store.state.scenario.animationRunning;
            const animationTime = this.$store.state.scenario.currentTimeStamp;
            this.$store.commit("scenario/animationRunning", !animationRunning);

            if(!animationRunning) {
                const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
                animate(deckLayer.implementation, null, null, animationTime);
            }
        },
        getTimeData(){
            this.timeStamps = [];
            this.timeCoords = [];
            const workingObj = {};
            this.abmData.forEach((v,i,a) =>{
                v.timestamps.forEach((v,i,a) => {
                    workingObj[v] = (workingObj[v]+1) || 1;
                });
            });
            this.timeObj = workingObj;
            console.log(this.timeObj);

            for (const [key, value] of Object.entries(workingObj)) {
                this.timeStamps.push(`${key}`);
                this.timeCoords.push(`${value}`)
            }

            this.minTime = Math.min(...this.timeStamps);
            this.maxTime = Math.max(...this.timeStamps);

            this.renderTimeGraph();
        },
        renderTimeGraph(){
            var ctx = document.getElementById('timeChart').getContext('2d');
            var chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.timeStamps,
                    //labels: ["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
                    datasets: [
                    {
                        data: this.timeCoords,
                        borderColor: 'rgba(253, 128, 93, 1)',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        borderWidth: 1,
                        fill: false,
                        label: 'Agents',
                        lineTension: 0
                    }
                    ]
                },
                options: {
                    scales: {
                    yAxes: [{
                        ticks: {
                        beginAtZero: true
                        }
                    }]
                    },
                    elements: {
                    point:{
                        radius: 0
                    },
                    line:{
                        tension: 1
                    },
                    },
                    legend: {
                        display:false,
                    }
                }
                });
        },
        functionFollowsForm(){
            alert("now function yet. come up with one :) ")
        },
        pauseAnimation(){  
            this.$store.commit("scenario/animationRunning", false);
        },
        increaseAnimationSpeed(){
            if(this.animationSpeed <= 21) {
                this.animationSpeed += 7;
            } else {
                this.animationSpeed = 7;
            }

            this.$store.commit("scenario/animationSpeed", this.animationSpeed);
        },
        changeCurrentTime(){
            //this.$store.commit("scenario/animationRunning", false);
            const newTime = this.currentValue;
            this.$store.commit("scenario/currentTimeStamp", newTime);
            //this.$store.commit("scenario/animationRunning", true);
            //getting deckLayer to start over animation
            const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
            animate(deckLayer.implementation, null, null, newTime);
        },
        updateData(){
            this.getTimeData();
            console.log(this.abmData);
        }
    },
    computed: {
        timeStamp(){
            return this.$store.state.scenario.currentTimeStamp;
        },
        abmData(){
            return this.$store.state.scenario.abmData;
        },
        animationRunning(){
            return this.$store.state.scenario.animationRunning;
        }
    },
    watch: {
        abmData(){
            this.updateData();
        },
        timeStamp(newValue, oldValue){
            this.currentValue = newValue;
        }
    }
}

</script>

<template>
    <div id="timesheet">
        <h3><strong>Operating grade</strong> /over time</h3>
        <div class="time_panel">
            <div class="time_graph">
                <canvas id="timeChart" width="300" height="160"></canvas>
            </div>
            <div class="time_slider">
                <div id="run_slider">
                    <v-slider
                        thumb-label="always"
                        :min="minTime"
                        :max="maxTime"
                        v-model="currentValue"
                        @change="changeCurrentTime"
                    ></v-slider>
                </div>
            </div>
            <div class="animation_info">
                <p>animation speed<strong> x{{animationSpeed/7}}</strong></p>
            </div>
        </div>
        <div class="button_section">
            <div class="btn_wrapper">   
                <v-btn @click="functionFollowsForm">
                    <v-icon>mdi-account-circle</v-icon>
                </v-btn>
            </div>
            <div class="btn_wrapper">   
                <v-btn @click="functionFollowsForm">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
            </div>
            <div class="btn_wrapper">   
                <v-btn @click="increaseAnimationSpeed">
                    <v-icon>mdi-fast-forward</v-icon>
                </v-btn>
                <div class="indicators">
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 7 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 14 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 21 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 28 }"></span>
                </div>
            </div>
            <div class="btn_wrapper">   
                <v-btn
                @click="triggerAnimation"
                >
                    <v-icon v-if="animationRunning">mdi-pause</v-icon>
                    <v-icon v-else>mdi-play</v-icon>
                </v-btn> 
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    @import "../../style.main.scss";

    #timesheet {
        position:fixed;
        bottom:10px;
        left:10px;
        width:auto;
        height:auto;
        max-width:360px;
        max-height:280px;
        background:rgba(0,0,0,0.5);
        padding:10px;
        box-sizing: border-box;
        @include drop_shadow;

        h3 {
            width:100%;
            text-align:right;
            font-family: 'Tajawal', sans-serif;
            margin:3px auto;
            font-size:90%;
            color:#ccc;
            font-weight:100;

            strong {
                font-size:100%;
                font-weight:500;
                color:whitesmoke;
                padding-right:10px;
            }
        }

        .time_panel {
            .time_graph {
                background:rgba(0,0,0,0.5);
            }
            .time_slider {
                width: 265px;
                margin: 0px 0px 0px auto;
                #run_slider {

                    ::v-deep.v-input {
                        .v-input__control {
                            .v-input__slot {
                                margin-bottom:0px !important;
                                .v-slider {
                                    
                                    margin:0 !important;
                                    .v-slider__track-container {
                                        background:radial-gradient(rgba(255,255,255,0.35), rgba(255,255,255,0.9));
                                        .v-slider__track-background {
                                            background: transparent !important;
                                            border-color:$bright2 !important;
                                        }
                                        .v-slider__track-fill {
                                            background:$opaqueorange !important;
                                        }
                                    }

                                    .v-slider__thumb-container {
                                        .v-slider__thumb {
                                            width:1px !important;
                                            height:150px !important;
                                            background:rgba(255,255,255,0.75) !important;
                                            top:-150px;
                                            left:0;
                                            transform:translate(0,0);

                                            &:hover {
                                                cursor:grab;
                                            }

                                            &:after {
                                                content:'';
                                                position:absolute;
                                                top:calc(100% - 4px);
                                                left:50%;
                                                transform:translateX(-50%);
                                                width:8px;
                                                height:8px;
                                                background:$orange;
                                                border:1px solid $bright1;
                                                border-radius:50%;
                                            }
                                        }
                                        .v-slider__thumb-label-container {
                                            display:none;
                                        }
                                    }
                                }
                            }

                            .v-messages {
                                display:none;
                            }
                        }
                    }
                }
            }

            .animation_info {
                    text-align:right;
                    opacity:0.5;
                    p {
                        color:$bright2;
                        font-size:80%;

                        strong {
                            color:$bright1;
                        }
                    }
                }
        }

        .button_section {    
            display: flex;
            flex-flow: row wrap;
            align-content: flex-end;
            position: absolute;
            top: 12.5%;
            left: calc(100% + 5px);
            width: 30px;
            height: 70%;

            .btn_wrapper {
                position:relative;
                ::v-deep.v-btn {  
                    position:relative;  
                    padding: 0;
                    margin: 0;
                    width: 30px;
                    height: 30px;
                    min-width: 0;
                    filter:invert(1);
                    background:$bright1;
                    margin-bottom:4px;
                    opacity:0.8;
                    @include drop_shadow;
                }

                 &:last-child {
                        ::v-deep.v-btn {   
                            opacity:1;
                            border:1px solid $reversed;
                        }
                    }

                    .indicators {
                        display:flex;
                        flex-flow:row wrap;
                        justify-content: center;
                        align-content:center;
                        position:absolute;
                        left:calc(100% + 2px);
                        top:0;
                        width:5px;
                        height:30px;
                        opacity:0;

                        .indicator {
                            flex:1 0 100%;
                            background:rgba(0,0,0,0.85);

                            &.marked {
                                display:block;
                                margin:1px auto;
                                width: 5px;
                                height: 5px;
                                background:$opaqueorange;
                            }
                        }
                    }

                &:hover {
                    .indicators {
                        opacity:1;
                        transition:0.3s;
                    }
                }
            }
        }
    }
</style>