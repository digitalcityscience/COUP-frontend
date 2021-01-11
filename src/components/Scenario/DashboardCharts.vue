<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'DashboardCharts',
    data() {
        return {
            radarChart: null,
            barChart: null,
            chartColors: {
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
            },
            amenityStats: {
              11: {
              complementary: 75,
              density: 190.60700164317015,
              diversity: 99.88310929281122,
              typesCount: 13
              },
              "grasbrook": {
              complementary: 122,
              density: 12.60700164317015,
              diversity: 90,
              typesCount: 32
              }
            },
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

      // TODO : create labels using this library
      //  https://chartjs-plugin-datalabels.netlify.app/guide/labels.html#dataset-overrides

      renderBarChart() {
        console.log("rendering bar chart")

        /*render graph via chart.js*/
        var ctx = document.getElementById('barChart').getContext('2d');
        if (this.barChart) {
          this.barChart.destroy();
        }

        var chartColors = this.chartColors;

        // create datasets
        let datasets = []
        for (const [focusArea, results] of Object.entries(this.amenityStats)) {
          let dataset = {
            data: Object.values(results),
            label: "Focus Area: " + focusArea.toString(),
            backgroundColor: chartColors[focusArea],
            borderColor: chartColors[focusArea],
            hoverBackgroundColor: chartColors[focusArea],
            hoverBorderColor: chartColors[focusArea],
            notes: Object.values(results)
          }
          datasets.push(dataset)
        }
        let labels = Object.keys(this.amenityStats["grasbrook"])

        console.log("labels", labels)
        console.log("datasets", datasets)

        this.barChart = new Chart(ctx, {
          type: 'horizontalBar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            scales: {
              xAxes: [{
                stacked: true
              }],
              yAxes: [{
                stacked: true
              }]
            }
          }
        })
      },

      renderRadarChart(){
        /*render graph via chart.js*/
        var ctx = document.getElementById('radarChart').getContext('2d');
        if (this.radarChart) {
          this.radarChart.destroy();
        }
        var color = Chart.helpers.color;
        var chartColors = this.chartColors;

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
          ['updateAmenityStatsChart', 'scenario/updateAmenityStatsChart'],
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
      updateAmenityStatsChart() {
        if (this.updateAmenityStatsChart) {
          console.log("updating the BAR chart")
          this.renderBarChart()
          this.updateAmenityStatsChart = !this.updateRadarChart
        }
      }
    }
}

</script>

<template>
  <div class="charts">
    <div v-show="this.amenityStats" class="bar_chart">
      <h3>Amenity Index</h3>
      <canvas id="barChart" width="500" height="300"></canvas>
    </div>
    <div v-show="this.abmStats" class="radar_chart" style="margin-top: 20px;">
      <h3>Activity Index</h3>
      <canvas id="radarChart" width="500" height="300"></canvas>
    </div>
  </div>

</template>

<style scoped lang="scss">
    @import "../../style.main.scss";

</style>
