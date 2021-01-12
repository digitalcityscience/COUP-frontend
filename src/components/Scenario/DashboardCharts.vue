<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.plugins.unregister(ChartDataLabels);
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
              "units": ["complementary trips", "places/km²", "Simpson Index", "place types"],
              11: {
                Complementarity: 75,
                Density: 12,
                Diversity: 99,
                Types: 13
              },
              "grasbrook": {
                Complementary: 122,
                Density: 90,
                Diversity: 90,
                Types: 32
              }
            },
            abmStats: {
              "units": ["pedestrians/m²", "%","interactions/m²", "minutes", "meters"],
              "grasbrook": {
                original: {
                  pedestrianDensity: 0.024,
                  temporalEntropyPercent: 78,
                  opportunitiesOfInteraction: 0.00039,
                  averageDuration: 35,
                  averageLength: 1070
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
                  pedestrianDensity: 0.044,
                  temporalEntropyPercent: 55,
                  opportunitiesOfInteraction: 0.010,
                  averageDuration: 65,
                  averageLength: 200
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
        let units = this.amenityStats["units"]

        for (const [key, results] of Object.entries(this.amenityStats)) {
          if (key === "units") {
            // ignore units
            continue
          }
          const focusArea = key
          // TODO: if in selectedFocusAreas (from store)
          let dataset = {
            data: Object.values(results),
            label: "Focus Area: " + focusArea.toString(),
            backgroundColor: chartColors[focusArea],
            borderColor: chartColors[focusArea],
            hoverBackgroundColor: chartColors[focusArea],
            hoverBorderColor: chartColors[focusArea],
            notes: {
              "originalValues": Object.values(results),
              "units": units
            },
              datalabels: {
                color: "lightgrey",
                anchor: "end",
                align:"end"
              }
          }
          datasets.push(dataset)
        }
        let labels = Object.keys(this.amenityStats["grasbrook"])

        console.log("labels", labels)
        console.log("datasets", datasets)

        this.barChart = new Chart(ctx, {
          plugins: [ChartDataLabels],
          type: 'horizontalBar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            legend: {
              display: false
            },
            scales: {
              xAxes: [{
                stacked: false
              }],
              yAxes: [{
                stacked: false
              }]
            },
            tooltips: {
              enabled: true,
              bodyFontStyle: 'bold',
              callbacks: {
                label: function (tooltipItem, data) {
                  //This will be the tooltip.body
                  const value = data.datasets[tooltipItem.datasetIndex].notes["originalValues"][tooltipItem.index]
                  const unit = units[tooltipItem.index]
                   return value + " " + unit
                }
              }
            }
          }
        })
      },
      /** radar chart for abmStats **/
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
        let units = this.abmStats["units"]

        for (const [key, results] of Object.entries(this.abmStats)) {
          if (key === "units") {
            // ignore units
            continue
          }

          const focusArea = key
          let displayLabels = 'auto'
          if (Object.keys(this.abmStats).length < 2) {
            displayLabels = focusArea === "grasbrook" ? 'auto' : true  // show stats for focusArea
          }

          let dataset = {
            data: Object.values(results["scaledResults"]),
            label: "Focus Area: " + focusArea.toString(),
            backgroundColor: color(chartColors[focusArea]).alpha(0.2),
            hoverBackgroundColor: color(chartColors[focusArea]).alpha(0.2),
            borderColor: chartColors[focusArea],
            pointBackgroundColor: color(chartColors[focusArea]).alpha(0.2),
            notes: {
              "originalValues": Object.values(results["original"]),
              "units": units
            },
            datalabels: {
              display: displayLabels,
              color: chartColors[focusArea],
              anchor: "end",
              align: 'start',
              offset: '60',
              formatter: function(value, context) {
                let unitString = ''
                if (context.hovered) {
                  unitString = ' ' + context.chart.data.datasets[context.datasetIndex].notes["units"][context.dataIndex]
                }
                return context.chart.data.datasets[context.datasetIndex].notes["originalValues"][context.dataIndex]
                  + unitString;
              },
              listeners: {
                enter: function(context) {
                  // Receives `enter` events for any labels of any dataset. Indices of the
                  // clicked label are: `context.datasetIndex` and `context.dataIndex`.
                  // For example, we can modify keep track of the hovered state and
                  // return `true` to update the label and re-render the chart.
                  context.hovered = true;
                  return true;
                },
                leave: function(context) {
                  // Receives `leave` events for any labels of any dataset.
                  context.hovered = false;
                  return true;
                }
              }
            }
          }
          datasets.push(dataset)
        }
        let labels = Object.keys(this.abmStats["grasbrook"]["scaledResults"])

        this.radarChart = new Chart(ctx, {
          plugins: [ChartDataLabels],
          type: 'radar',
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            legend: {
              display: false
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
              title: "",
              callbacks: {
                title: function(tooltipItem, data) {
                  return data.labels[tooltipItem[0].index]
                },
                label: function (tooltipItem, data) {
                  //This will be the tooltip.body
                  const value =  data.datasets[tooltipItem.datasetIndex].notes["originalValues"][tooltipItem.index]
                  const unit = data.datasets[tooltipItem.datasetIndex].notes["units"][tooltipItem.index]
                  return value + " " + unit;
                }
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
