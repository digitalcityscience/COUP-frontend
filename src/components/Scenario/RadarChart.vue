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
                original: {
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
                original: {
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
        var color = Chart.helpers.color;
        var chartColors = {
          "grasbrook": "lightgrey",
          1: "#e172d8",
          2: "#eda361",
          3: "#8712cf",
          4: "#d37373",
          5: "#32cd17",
          6: "#2bca5b",
          7: "#1a51d1",
          8: "#d2c74f",
          9: "#56ebc8",
          10: "#ed80b3",
          11: "#6a4fef",
          12: "#70b6c9"
        }

        // create datasets
        let datasets = []
        for (const [focusArea, results] of Object.entries(this.abmStats)) {
          // TODO: if in selectedFocusAreas (from store)
          console.log(focusArea, results);

          let dataset = {
            data: Object.values(results["scaledResults"]),
            label: "Focus Area: " + focusArea.toString(),
            backgroundColor: color(chartColors[focusArea]).alpha(0.2),
            borderColor: chartColors[focusArea],
            pointBackgroundColor: chartColors[focusArea],
            notes: Object.values(results["original"])
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
              position: 'top',
            },
            title: {
              display: false,
            },
            scale: {
              gridLines: {
                display: true,
                circular: true
              },
              ticks: {
                display: false
                // beginAtZero: true
              }
            },
            tooltips: {
              enabled: true,
              bodyFontStyle: 'bold',
              callbacks: {
                label: function (tooltipItem, data) {
                  //This will be the tooltip.body
                  return data.datasets[tooltipItem.datasetIndex].notes[tooltipItem.index];
                }
              },
              // setting the
              custom: function (tooltip) {
                // show the original value as tittle
                // original value is return from label callback above
                tooltip.title = tooltip.body[0].lines[0]
              }
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
    <canvas id="radarChart" width="500" height="300"></canvas>
  </div>

</template>

<style scoped lang="scss">
    @import "../../style.main.scss";

</style>
