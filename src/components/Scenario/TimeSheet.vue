<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import {abmTripsLayerName, animate} from "@/store/deck-layers";
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'TimeSheet',
    data() {
        return {
            timeChart: null,
            currentTimeSet: 0,
            animationSpeed: 21,
            timeArray: {},
            timeStamps: [],
            timeCoords: [],
            timeHours: [],
            filterCoords:[],
            timeFilter: false,
            checkState: false,
            filter:null,
            filterLabels: ["Pedestrian","Bicycle","Public Transport","Car", "No Filter"],
            filterOptions: {"Pedestrian": "foot", "Bicycle": "bicycle", "Public Transport": "public_transport", "Car": "car"},
            minTime: 0,
            maxTime: 0,
        }
    },
    computed: {
        currentTimeStamp(){
            return this.$store.state.scenario.currentTimeStamp;
        }
    },
    mounted(){
    },
    updated(){
        //this.renderTimeGraph();
    },
    created(){
        document.onkeydown = this.onkeydown
    },
    components: {},
    methods:{
        onkeydown(e){
            if(e.which === 32){
                this.triggerAnimation();
            }
        },
        triggerAnimation(){
            /*functionality for play button*/
            console.log(this.currentTimeStamp);
            const animationRunning = this.$store.state.scenario.animationRunning;
            this.$store.commit("scenario/animationRunning", !animationRunning);

            if(!animationRunning) {
                /*deactivate HeatMap*/
                this.$store.commit("scenario/heatMap", false);
                const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);

                if(deckLayer) {
                    /*if TripsLayer exists animate it*/
                    animate(deckLayer.implementation, null, null, this.currentTimeStamp);
                } else {
                    /*if TripsLayer was removed by HeatMap rebuild it*/
                    this.$store.dispatch('scenario/rebuildDeckLayer').then(
                        deckLayer => {
                            const newDeckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
                            animate(newDeckLayer.implementation, null, null, this.currentTimeStamp);
                        }
                    );
                }
            }
        },
        getDataForTimeChart(){
          this.minTime = 8 // time chart start time
          this.maxTime = 24 // time chart end time
          //this.maxTime = 99999;
          const intervalLength = 5 * 60; // interval length in seconds; max interval length = 1h for labels to work
          const simulationLength = (this.maxTime - this.minTime) * 60 * 60  // max time in seconds / intervalLength

          let intervals = []
          this.intervalLabels = [];
          this.busyAgentsPerInterval = {}
          this.timeCoords = [];

          /* create time intervals and their labels on x-axis */
          const intervalCount = Math.round(simulationLength  / intervalLength)
          for (let intervalIndex = 0; intervalIndex <= intervalCount; intervalIndex++) {
            const interval = intervalIndex * intervalLength
            const intervalLabel = Math.floor((interval / 3600) + 8) + ":00" // labels for full hours
            intervals.push(interval)
            this.intervalLabels.push(intervalLabel)
          }

          // initialize busy agents per interval with 0
          const emptyInterval = {}
          for (let mode of [...Object.values(this.filterOptions), 'total']) {
            emptyInterval[mode] = 0
          }
          for (let interval of intervals) {
            this.busyAgentsPerInterval[`${interval}`] = JSON.parse(JSON.stringify(emptyInterval))
          }


          // TODO include information on transport mode to enable filter!

          /*Add up total active agents per interval*/
          // iterate over each agent's timestamps first and log the intervals during which the agent is active
          this.abmData.forEach((agent,i,a) => {
            let transportMode = agent["agent"]["mode"]
            let activeIntervals = []
            agent.timestamps.forEach((timeStampValue,i,a) => {
              // iterate over all timestamps and find intervals during which the agent is active
              let matchingInterval = Math.floor( timeStampValue / intervalLength) * intervalLength
              if (!activeIntervals.includes(matchingInterval)) {
                // if the agent's activity in this interval wasn't logged yet
                // increment the busy agents count for this interval
                activeIntervals.push(matchingInterval)
                this.busyAgentsPerInterval[matchingInterval][transportMode] += 1
                this.busyAgentsPerInterval[matchingInterval]["total"] += 1
              }
            });
          });

          /* get total active active agents (no matter the transport mode) and reformat data back into array*/
          for (const [key, value] of Object.entries(this.busyAgentsPerInterval)) {
            this.timeCoords.push(`${value['total']}`)
          }

          this.filterCoords = this.timeCoords;
          this.renderTimeGraph();
        },
        renderTimeGraph(){
            /*render graph via chart.js*/
            var ctx = document.getElementById('timeChart').getContext('2d');
            if (this.timeChart) {
              this.timeChart.destroy();
            }

            console.log("fiilter coords")
            console.log(this.filterCoords)

            this.timeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.intervalLabels,
                    datasets: [
                    {
                        data: this.timeCoords,
                        borderColor: 'rgba(253, 128, 93, 1)',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        borderWidth: 1,
                        fill: false,
                        label: 'all Agents',
                    },{
                        data: this.filterCoords,
                        display:this.timeFilter,
                        label: 'filtered Agents',
                        borderColor: 'rgba(81,209,252,0.85)',
                        borderWidth:1,
                        fill:true,
                    }
                    ]
                },
                options: {
                    scales: {
                    yAxes: [{
                        ticks: {
                        beginAtZero: true
                        },
                        gridLines: {
                            color: "rgba(49,48,73,0.35)",
                        }
                    }],
                    xAxes: [{
                        gridLines: {
                            color: "rgba(49,48,73,0.35)",
                        }
                    }],
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
      /*change Time via Slider*/
      changeCurrentTime(){
            /*reanimate abm Tripslayer with new currentTime*/
            if(this.animationRunning) {
                const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
                animate(deckLayer.implementation, null, null, this.currentTimeStamp);
            }
        },
        activateFilterGraph(){
           this.timeFilter = true;
           this.filterCoords = [];

           if (this.filter === "No Filter") {
             // do not filter timeCoords
             this.filterCoords = [...this.timeCoords]
           } else {
             // iterate over busy agents and filter for chosen transport option
             for (const [timestamp, counts] of Object.entries(this.busyAgentsPerInterval)) {
               this.filterCoords.push(`${counts[this.filterOptions[this.filter]]}`)
             }
           }
           this.renderTimeGraph();
        },
    },
      computed: {
        ...mapState([
          'activeMenuComponent',
        ]),
        ...generateStoreGetterSetter([
            ['currentTimeStamp', 'scenario/currentTimeStamp']
          ]
        ),
        abmData(){
            return this.$store.state.scenario.abmData;
        },
        heatMapActive(){
            return this.$store.state.scenario.heatMap;
        },
        animationRunning(){
            return this.$store.state.scenario.animationRunning;
        },
        showUi(){
            return this.$store.state.scenario.showUi;
        }
    },
    watch: {
        abmData(){
          console.log("time sheet watcher")
          console.log("calling getDataForTimeChart")
          this.getDataForTimeChart();
        },
        heatMapActive(){
            if(this.heatMapActive) {
                this.$store.commit('scenario/animationRunning', false);
            }
        }
    }
}

</script>

<template>
    <div v-if="activeMenuComponent === 'AbmScenario'" id="timesheet" :class="{ ui_hide: !showUi }">
        <!-- <h3><strong>Operating grade</strong> /over time</h3> -->
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
                        v-model="currentTimeStamp"
                        @change="changeCurrentTime"
                    ></v-slider>
                </div>
            </div>
            <div class="animation_info">
                <p>animation speed<strong> x{{animationSpeed/7}}</strong></p>
            </div>
        </div>
        <div class="button_section">
            <!-- unused button with no function
            <div class="btn_wrapper">
                <v-btn @click="functionFollowsForm">
                    <v-icon>mdi-account-circle</v-icon>
                </v-btn>
            </div>
            -->
            <div class="btn_wrapper" v-bind:class="{ highlight: checkState }">
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    @click="checkState = !checkState">
                    <v-icon>mdi-chart-line</v-icon>
                  </v-btn>
                </template>
                <span>Filter by Transport Mode</span>
              </v-tooltip>
                <div class="filterMenu" v-bind:class="{ visible: checkState }">
                    <div class="wrapper">
                        <!--<div class="hint">
                            <p>Select a dataset to compare</p>
                        </div>-->
                        <v-select
                            :items="filterLabels"
                            label="Select"
                            hint="Choose dataset for comparison"
                            persistent-hint
                            dark
                            v-model="filter"
                            @change="activateFilterGraph"
                        ></v-select>
                    </div>
                </div>
            </div>
            <div class="btn_wrapper">
                  <v-tooltip right>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn @click="increaseAnimationSpeed">
                        <v-icon
                          v-bind="attrs"
                          v-on="on"
                        >mdi-fast-forward</v-icon>
                      </v-btn>
                    </template>
                    <span>Adjust Simulation Speed</span>
              </v-tooltip>
                <div class="indicators">
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 7 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 14 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 21 }"></span>
                    <span class="indicator" v-bind:class="{ marked: animationSpeed >= 28 }"></span>
                </div>
            </div>
            <div class="btn_wrapper">
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    v-bind="attrs"
                    v-on="on"
                    @click="triggerAnimation"
                  >
                    <v-icon v-if="animationRunning">mdi-pause</v-icon>
                    <v-icon v-else>mdi-play</v-icon>
                  </v-btn>
                </template>
                <span v-if="animationRunning">Pause Animation</span>
                <span v-else>Play Animation</span>
              </v-tooltip>
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

        &.ui_hide {
            transform:translateX(-100vw);
            transition:0.3s;
        }

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
                                            height:177px !important;
                                            background:rgba(255,255,255,0.75) !important;
                                            top:-177px;
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
                    width: 30px;
                    height: 30px;
                    min-width: 0;
                    filter:invert(1);
                    background:$bright1;
                    margin: 0 0 4px;
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

                .filterMenu {
                    opacity:0;
                    pointer-events:none;
                    position: absolute;
                    top: -35px;
                    left: calc(100% + 5px);
                    width: 300px;
                    padding: 15px 20px;
                    box-sizing: border-box;
                    background: rgba(0, 0, 0, 0.75);
                    @include drop_shadow;
                }

                &.highlight {
                    ::v-deep.v-btn {
                        border:1px solid $bright2;
                        filter:invert(0) !important;
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
