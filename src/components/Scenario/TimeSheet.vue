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
            swChart: null,
            rainChart: null,
            swBValues: {"n": 0, "r":[]},
            swPTValues: {"n": 0, "r":[]},
            swTValues: {"n": 0, "r":[]},
            currentTimeSet: 0,
            animationSpeed: 21,
            timeArray: {},
            swTimeStamps: Array.from(Array(288).keys()),
            timeStamps: [],
            timeCoords: [],
            timeHours: [],
            heatMapRange:{ left: "0%", width: "100%"},
            filterCoords:[],
            activeAbmTimeCoords:[],
            transCoords: [],
            intervalNes:[],
            timeFilter: false,
            checkState: false,
            filter:null,
            filterLabels: ["Pedestrian","Bicycle","Public Transport","Car", "No Filter"],
            filterOptions: {"Pedestrian": "foot", "Bicycle": "bicycle", "Public Transport": "public_transport", "Car": "car"},
            minTime: 0,
            maxTime: 0,
            currentTime:0,
            loopSetter:false,
            windowWidth: window.innerWidth,
            mobileTimePanel: false,
            rainTime:0,
            swAnimationRunning:false,
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
            const animationRunning = this.$store.state.scenario.animationRunning;
            this.$store.commit("scenario/animationRunning", !animationRunning);

            if(!animationRunning){
                const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
                animate(deckLayer.implementation, null, null, this.currentTimeStamp);
            }
        },
        updateSWLayer(){
            this.$store.commit("scenario/rainTime", this.rainTime);
            this.$store.dispatch('scenario/updateSWLayerTime');
        },
        getDataForTimeChart(){
            Object.entries(this.abmSimpleTimes).forEach(entry =>{
                const [key, value] = entry;
                let label = Math.floor(key/3600) + 8 + ":00";
                let coords = [...new Set(value.all)];

                this.timeStamps.push(label);
                this.timeCoords.push(coords.length);
            });

            this.renderTimeGraph();
        },
        getFilteredDataForTimeChart(){
            this.activeAbmTimeCoords = [];
            Object.entries(this.abmSimpleTimes).forEach(([key, value]) => {
                this.transCoords = [];
                var spliceArr = [];

                Object.entries(this.filterSettings).forEach(([filterKey, filterValue]) => {
                    if(!filterValue){
                        spliceArr = [...new Set(value[filterKey]), ...spliceArr];
                    }
                });

                let removeDuplicates = [...new Set(value.all)];
                this.transCoords = removeDuplicates.filter(el => !spliceArr.includes(el));
                this.activeAbmTimeCoords.push(this.transCoords.length);
            });
            this.renderTimeGraph();
        },
        calculateSWDataSets(){
            this.swBValues = {"n": 0, "r": []}; // buildings
            this.swPTValues = {"n": 0, "r": []};  // parks and plazas
            this.swTValues = {"n": 0, "r": []};  // streets
            Object.entries(this.swData).forEach(([key, value]) => {
                // these are buildings: B_C -> Building commercial
                if(value.type == "B_C" || value.type == "B_R" || value.type == "B_S") {
                    // what is n and r???
                    this.swBValues.n = this.swBValues.n +1;
                    this.swBValues.r.length > 0 ? this.swBValues.r = this.swBValues.r.map(function (num, i) { return num + value.runoff[i]; }) : this.swBValues.r = value.runoff;
                }

                if(value.type == "PT_park" || value.type == "PT_promenade" || value.type == "PT_plaza") {
                    this.swPTValues.n = this.swPTValues.n +1;
                    this.swPTValues.r.length > 0 ? this.swPTValues.r = this.swPTValues.r.map(function (num, i) { return num + value.runoff[i]; }) : this.swPTValues.r = value.runoff;
                }

                if(value.type == "T_street") {
                    this.swTValues.n = this.swTValues.n +1;
                    this.swTValues.r.length > 0 ? this.swTValues.r = this.swTValues.r.map(function (num, i) { return num + value.runoff[i]; }) : this.swTValues.r = value.runoff;
                };
            });

            this.swBValues.r = this.swBValues.r.map(num => Math.round((num/this.swBValues.n)*0.75) );
            this.swPTValues.r = this.swPTValues.r.map(num => Math.round((num/this.swPTValues.n)*1.1) );
            this.swTValues.r = this.swTValues.r.map(num => Math.round((num/this.swTValues.n)*0.98) );

            this.swTimeStamps = Array.from(Array(288).keys());
            this.swTimeStamps = this.swTimeStamps.map(num => Math.floor(num/12) + ":00");  // make hours like "8:00"
            this.renderSWGraphRO();
            this.renderSWGraphRain();
        },
        renderTimeGraph(){
            /*render graph via chart.js*/
            var ctx = document.getElementById('timeChart').getContext('2d');
            if (this.timeChart) {
              this.timeChart.destroy();
            }

            this.timeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.timeStamps,
                    datasets: [
                    {
                        data: this.timeCoords,
                        //borderColor: 'rgba(253, 128, 93, 1)',
                        borderColor: 'rgba(16,245,229,1)',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        borderWidth: 1,
                        fill: false,
                        label: 'all Agents',
                    },{
                        data: this.filterCoords,
                        display:this.timeFilter,
                        label: 'compared Agents',
                        borderColor: 'rgba(81,209,252,0.85)',
                        borderWidth:1,
                        fill:true,
                    },{
                        data: this.activeAbmTimeCoords,
                        display:this.filterActive,
                        label: 'filtered Agents',
                        borderColor: 'rgba(10,171,135,0.85)',
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
       // runOff graph
        renderSWGraphRO(){
            var ctxSW = document.getElementById('swChart').getContext('2d');

            if (this.swChart) {
              this.swChart.destroy();
            }

            this.swChart = new Chart(ctxSW, {
                type: 'line',
                data: {
                    labels: this.swTimeStamps,
                    datasets: [
                    {
                        data: this.swBValues.r,
                        //borderColor: 'rgba(253, 128, 93, 1)',
                        borderColor: 'rgba(16,245,229,1)',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        borderWidth: 1,
                        fill: false,
                        label: 'Buildings',
                    },{
                        data: this.swPTValues.r,
                        label: 'Plazas & Parks',
                        borderColor: 'rgba(81,209,252,0.85)',
                        borderWidth:1,
                        fill:true,
                    },{
                        data: this.swTValues.r,
                        label: 'Streets',
                        borderColor: 'rgba(10,171,135,0.85)',
                        borderWidth:1,
                        fill:true,
                    }
                    ]
                },
                options: {
                    scales: {
                    yAxes: [{
                        /*ticks: {
                        beginAtZero: true
                        },*/
                        max: "350",
                        scaleLabel: {
                            display: true,
                            labelString: 'Runoff'
                        },
                        gridLines: {
                            color: "rgba(49,48,73,0.35)",
                        },
                        ticks: {
                            beginAtZero: true,
                            stepSize:35,
                            maxTicksLimit:10,
                            suggestedMax:350,
                            display: false
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'hours'
                        },
                        gridLines: {
                            color: "rgba(49,48,73,0.35)",
                        },
                        ticks: {
                            beginAtZero: true,
                            //display: false
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
        renderSWGraphRain(){
           console.warn("rain amount", this.rainAmount)


            var ctxR = document.getElementById('rainChart').getContext('2d');

            if (this.rainChart) {
              this.rainChart.destroy();
            }

            this.rainChart = new Chart(ctxR, {
                type: 'bar',
                data: {
                    labels: Array.from(Array(this.rainAmount.length).keys()),
                    datasets: [
                    {
                        data: this.rainAmount,
                        //borderColor: 'rgba(16,245,229,1)',
                        backgroundColor: 'rgba(255,255,255,0.5)',
                        fill: true,
                        label: 'mm/m²',
                    }
                    ]
                },
                options: {
                    legend: {
                        display: false
                    },scales: {
                    xAxes: [{
                        gridLines: {
                            display:false,
                            color: "rgba(49,48,73,0.35)",
                        },
                        ticks: {
                            beginAtZero: true,
                            display:false,
                        }
                    }],
                    yAxes: [{
                        max: "20",
                        scaleLabel: {
                            display: true,
                            labelString: 'mm/m²'
                        },
                        gridLines: {
                            display:false,
                            color: "rgba(49,48,73,0.35)",
                        },
                        ticks: {
                            stepSize:1,
                            maxTicksLimit:20,
                            suggestedMax:20,
                            display: false
                    }
                    }],
                }
                }
            })
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
                animate(deckLayer.implementation, null, null, this.currentTime);
            }
        },
        activateComparisonGraph(){
           this.timeFilter = true;
           this.filterCoords = [];

           if (this.filter === "No Filter") {
             // do not filter timeCoords
             this.filterCoords = [...this.timeCoords]
           } else {

                Object.values(this.abmSimpleTimes).forEach(value =>{
                    let coords = [...new Set(value[this.filterOptions[this.filter]])];
                    this.filterCoords.push(coords.length);
                });

                this.renderTimeGraph();
           }
           this.renderTimeGraph();
        },
        setLoop(){
            this.loopSetter = !this.loopSetter;
            this.$store.commit("scenario/setLoop", this.loopSetter);
        },
        autoLoopAnimation(){
            var animationSpeed = 1;
            var max = 288;

            if(this.swAnimationRunning){
                if (this.rainTime + animationSpeed >= max) { this.rainTime = 0 }
                else { this.rainTime = this.rainTime + animationSpeed};

                this.$store.commit("scenario/rainTime", this.rainTime);
                this.$store.dispatch('scenario/updateSWLayerTime');
                 window.requestAnimationFrame(() => {
                    this.autoLoopAnimation();
                 });
            }
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
        selectedRange(){
            return this.$store.state.scenario.selectedRange;
        },
        abmTimePaths(){
            return this.$store.state.scenario.abmTimePaths;
        },
        activeTimePaths(){
            return this.$store.state.scenario.activeTimePaths;
        },
        abmSimpleTimes(){
            return this.$store.state.scenario.abmSimpleTimes;
        },
        currentTimeStamp(){
            return this.$store.state.scenario.currentTimeStamp;
        },
        filterSet(){
            return this.$store.state.scenario.clusteredAbmData;
        },
        filterSettings(){
            return this.$store.state.scenario.filterSettings;
        },
        activeAbmSet(){
            return this.$store.state.scenario.activeAbmSet;
        },
        heatMapActive(){
            return this.$store.state.scenario.heatMap;
        },
        animationRunning(){
            return this.$store.state.scenario.animationRunning;
        },
        filterActive(){
            return this.$store.state.scenario.filterActive;
        },
        showUi(){
            return this.$store.state.scenario.showUi;
        },
        loop(){
            return this.$store.state.scenario.loop;
        },
        stormWater(){
            return this.$store.state.scenario.stormWater;
        },
        selectGraph(){
            return this.$store.state.scenario.selectGraph;
        },
        swData(){
            return this.$store.state.scenario.swData;
        },
        rainAmount(){
            return this.$store.state.scenario.rainAmount;
        }
    },
    watch: {
        activeAbmSet(){
            this.getDataForTimeChart();
        },
        heatMapActive(){
            if(this.heatMapActive) {
                this.$store.commit('scenario/animationRunning', false);
            }
        },
        currentTimeStamp(){
            this.currentTime = this.currentTimeStamp;
        },
        selectedRange(){
            var leftVal = (this.selectedRange[0] - 8) * 60 * 60;
            var rightVal = (this.selectedRange[1] - 8) * 60 * 60;

            this.heatMapRange.left = (leftVal * 100)/57600 + "%";
            this.heatMapRange.width = ((rightVal - leftVal) * 100)/57600 + "%";
        },
        swData(){
            this.$store.commit("scenario/selectGraph", "sw");
            this.calculateSWDataSets();
        },
        swAnimationRunning(){
            if(this.swAnimationRunning){this.autoLoopAnimation()};
        },
        filterSettings:{
            deep: true,
            handler(){
                if(this.filterActive){
                    this.getFilteredDataForTimeChart();
                } else {
                    this.activeAbmTimeCoords = [];
                    this.renderTimeGraph();
                }
            }
        }
    }
}

</script>

<template>
    <!--<div v-if="activeMenuComponent === 'AbmScenario'" id="timesheet" :class="{ ui_hide: !showUi || abmData == null }">-->
        <div id="timesheet" :class="{ ui_hide: !showUi || (activeAbmSet == null && stormWater == false)}">
        <div class="graph_selection" v-if="activeAbmSet != null && stormWater != false">
            <v-btn>Show ABM Results</v-btn>
            <v-btn>Show Storm Water Results</v-btn>
        </div>
        <!-- <h3><strong>Operating grade</strong> /over time</h3> -->
        <div class="time_panel panel" :class="{ show: mobileTimePanel, dismiss: selectGraph != 'abm' }">
            <div class="time_graph">
                <canvas id="timeChart" width="300" height="200"></canvas>
            </div>
            <div class="time_slider slider">
                <div id="run_slider">
                    <v-slider
                        thumb-label="always"
                        :min="minTime"
                        :max="57600"
                        v-model="currentTime"
                        @change="changeCurrentTime"
                    ></v-slider>
                </div>
                <div class="range_slider" :style="{ 'left': heatMapRange.left, 'width': heatMapRange.width }">>
                </div>
            </div>
            <div class="animation_info">
                <p>animation speed<strong> x{{animationSpeed/7}}</strong></p>
            </div>
        </div>
        <div class="sw_panel panel" :class="{ show: mobileTimePanel, dismiss: selectGraph != 'sw' }">
            <div class="sw_graph">
                <canvas id="rainChart" width="300" height="40"></canvas>
                <canvas id="swChart" width="300" height="200"></canvas>
                <div class="sw_slider slider">
                    <div id="rain_slider">
                        <v-slider
                        v-model="rainTime"
                        max="287"
                        min="0"
                        hide-details
                        dark
                        @change="updateSWLayer()"
                        ></v-slider>
                    </div>
            </div>
            </div>
        </div>
        <div :class="{ dismiss: selectGraph != 'abm' }" class="button_section abm_buttons">
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
                <span>Change Selection</span>
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
                            @change="activateComparisonGraph"
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

              <div v-if="loop" class="looper" @click="setLoop" :class="{highlight: loopSetter}">
                  <v-icon>mdi-backup-restore</v-icon>
              </div>
            </div>
            <div v-if="windowWidth <= 720" class="btn_wrapper" :class="{ highlight: mobileTimePanel }">
                <v-btn @click="mobileTimePanel = !mobileTimePanel">
                    <v-icon>mdi-timetable</v-icon>
                </v-btn>
            </div>
        </div>
        <div :class="{ dismiss: selectGraph != 'sw' }" class="button_section abm_buttons">
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
                <span>Compare by Transport Mode</span>
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
                            @change="activateComparisonGraph"
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
                    @click="swAnimationRunning = !swAnimationRunning"
                  >
                    <v-icon v-if="swAnimationRunning">mdi-pause</v-icon>
                    <v-icon v-else>mdi-play</v-icon>
                  </v-btn>
                </template>
                <span v-if="swAnimationRunning">Pause Animation</span>
                <span v-else>Play Animation</span>
              </v-tooltip>

              <div v-if="loop" class="looper" @click="setLoop" :class="{highlight: loopSetter}">
                  <v-icon>mdi-backup-restore</v-icon>
              </div>
            </div>
            <div v-if="windowWidth <= 720" class="btn_wrapper" :class="{ highlight: mobileTimePanel }">
                <v-btn @click="mobileTimePanel = !mobileTimePanel">
                    <v-icon>mdi-timetable</v-icon>
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

        .panel {
            display:block;
            position:relative;
            opacity:1;
            z-index:1;
            pointer-events: all;

            .sw_graph {
                position:relative;
                width:300px;
                height:200px;

                #swChart {
                    position:absolute;
                    bottom:0;
                    left:0;
                }

                #rainChart {
                    position:absolute;
                    top:0;
                    left:0;
                    transform:scale(1,-1);
                }


                .sw_slider {
                    position:relative;
                    width: 260px;
                    top: 162px;
                    left: -8px;
                    margin: 0px 0px 0px auto;

                    #rain_slider {

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
            }

            &.dismiss {
                position:absolute;
                opacity:0;
                z-index:-5;
                pointer-events:none;
            }
        }

        .time_panel {
            .time_graph {
                background:rgba(0,0,0,0.5);
            }
            .time_slider {
                position:relative;
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

                .range_slider {
                    position:absolute;
                    height:160px;
                    bottom:70px;
                    background:rgba(255,255,255,0.15);
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

            &.dismiss {
                display:none;
            }

            .btn_wrapper {
                position:relative;

                .looper {
                    position:absolute;
                    top:0;
                    right:-35px;
                    width:30px;
                    height:30px;
                    border-radius:3px;
                    background:whitesmoke;
                    @include drop_shadow;

                    .v-icon {
                        color:#222;
                        width:20px;
                        height:20px;
                        margin:5px;
                    }

                    &:hover {
                        cursor:pointer,
                    }

                    &.highlight {
                        background:$orange;
                        filter:invert(1);
                        border:1px solid black;
                    }
                }

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

                 &:nth-child(3) {
                        ::v-deep.v-btn {
                            opacity:1;
                            border:1px solid $darkred;
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

        @media(max-device-width:720px){
            width:calc(100% - 20px);
            left:10px;
            max-width:100vw;
            background:transparent;
            z-index:10;

            .time_panel {
                background:rgba(0, 0, 0, 0.5);
                backdrop-filter:blur(5px);
                width:100%;
                left:0;
                padding:10px;
                box-sizing:border-box;
                transform:translateY(100vh);

                .time_slider {
                    width:90%;
                }

                &.show {
                    transform:translateY(0);
                }
            }

            .button_section {
                position:fixed;
                bottom:0;
                left:0;
                top:auto;
                width:100%;
                height:40px;
                background:black;
                display:flex;
                flex-flow:row wrap;
                justify-content:center;

                .btn_wrapper {
                    margin:0 10px;

                    &:nth-child(1){
                        order:1;
                    }

                    &:nth-child(3){
                        order:2;

                        button {
                            border-radius:0px;
                            border:1px solid black;
                            background:#E65449;
                        }
                    }

                    &:nth-child(2){
                        order:3;
                    }

                    &:last-child{
                        order:4;
                        justify-self:flex-end;
                        margin:0 5px 0 auto;

                        .v-btn {
                            border-radius:0px;
                            border:none;
                        }

                        &.highlight {
                            .v-btn {
                                background:rgba(255,255,255,0.85);
                                border:1px solid white;
                            }
                        }
                    }
                }
            }
        }
    }
</style>
