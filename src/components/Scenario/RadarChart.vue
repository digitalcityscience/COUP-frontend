<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import {abmTripsLayerName, animate} from "@/store/deck-layers";
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'RadarChart',
    data() {
        return {
            radarChart: null,
            abmStats: {
              "grasbrook": {
                orginal: {
                  pedestrianDensity: 0.024848683742117815,
                  temporalEntropyPercent: 78,
                  opportunitiesOfInteraction: 0.000397721407243644,
                  averageDuration: 35.77064220183487,
                  averageLength: 1070.9633027522937
                },
                scaledResults: {
                  "Pedestrian Density": 8.282894580705939,
                  "Temporal Entropy": 55,
                  "Opportunities for Interaction": 0.397721407243644,
                  "Trip Duration": 59.61773700305811,
                  "Trip Length": 71.39755351681958
                }
              },
              11: {
                orginal: {
                  pedestrianDensity: 0.044848683742117815,
                  temporalEntropyPercent: 55,
                  opportunitiesOfInteraction: 0.010397721407243644,
                  averageDuration: 65.77064220183487,
                  averageLength: 200.9633027522937
                },
                scaledResults: {
                  "Pedestrian Density": 32.282894580705939,
                  "Temporal Entropy": 55,
                  "Opportunities for Interaction": 0.597721407243644,
                  "Trip Duration": 29.61773700305811,
                  "Trip Length": 21.39755351681958
                }
              }
            }
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
      renderRadarChart(){
        console.log("rendering radar chart")
        console.log("abmStats for chart", this.abmStats)
        /*render graph via chart.js*/
        var ctx = document.getElementById('radarChart').getContext('2d');
        if (this.radarChart) {
          this.radarChart.destroy();
        }

        // create datasets
        let datasets = []
        for (const [focusArea, results] of Object.entries(this.abmStats)) {
          // TODO: if in selectedFocusAreas (from store)
          console.log(focusArea, results);

          let dataset = {
            data: Object.values(results["scaledResults"]),
            borderColor: 'rgba(16,245,229,1)',
            backgroundColor: 'rgba(0,0,0,0.75)',
            borderWidth: 1,
            fill: true,
            label: "Focus Area: " + focusArea.toString(),
          }
          datasets.push(dataset)
        }
        let labels = Object.keys(this.abmStats["grasbrook"]["scaledResults"])

        this.radarChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            legend: {
              display:true,
            }
          }
        });
      }
    },
      computed: {
        ...generateStoreGetterSetter([
          ['loader', 'scenario/loader'],
          ['updateRadarChart', 'scenario/updateRadarChart'],
         // ['abmStats', 'scenario/abmStats']
        ])
    },
    watch: {
      updateRadarChart() {
        if (this.updateRadarChart) {
          console.log("updating the chart")
          this.renderRadarChart()
          this.updateRadarChart = !this.updateRadarChart
        }
      },
      loader() {
        if (this.loader) {
          this.loader = false
        }
        console.log("loader changed in abmScenario.vue")
      },
    }
}

</script>

<template>
  <div v-show="this.abmStats" class="radar_chart">
    <canvas id="radarChart" width="300" height="160"></canvas>
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
                    height:120px;
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
    }
</style>
