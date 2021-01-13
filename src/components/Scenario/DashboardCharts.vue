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
            radarChartReady: false,
            barChartReady: false,
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
        }
    },
    mounted(){
      this.renderBarChart()
      this.renderRadarChart()
    },
    updated(){
    },
    created(){
    },
    components: {},
    methods:{
      renderBarChart() {
        this.barChartReady = false

        // destroy the old chart
        if (this.barChart) {
          this.barChart.destroy();
        }

        if (Object.keys(this.amenityStats).length === 0) {
          // no stats, no chart
          return
        }
        console.log("rendering bar chart")

        /*render graph via chart.js*/
        var ctx = document.getElementById('barChart').getContext('2d');
        var chartColors = this.chartColors;

          // create datasets
        let datasets = []
        let units = this.amenityStats["units"]

        for (const [key, results] of Object.entries(this.amenityStats)) {
          if (key === "units") {
            // ignore units
            continue
          }
          if (this.selectedFocusAreas.indexOf(parseInt(key)) === -1 && key !== "grasbrook") {
            // ignore not selected areas
            continue
          }
          const focusArea = key

          let dataset = {
            data: Object.values(results),
            label: "Focus Area: " + focusArea.toString(),
            backgroundColor: chartColors[focusArea],
            borderColor: chartColors[focusArea],
            hoverBackgroundColor: chartColors[focusArea],
            hoverBorderColor: chartColors[focusArea],
            maxBarThickness: 20,
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
                   return value.toString() + " " + unit
                }
              }
            }
          }
        })
        this.barChartReady = true
        this.updateAmenityStatsChart = false
      },
      /** radar chart for abmStats **/
      renderRadarChart(){
        this.radarChartReady = false

        // destroy the old chart
        if (this.radarChart) {
          this.radarChart.destroy();
        }

        if (Object.keys(this.abmStats).length === 0) {
          // no stats, no chart
          return
        }

        /*render graph via chart.js*/
        var ctx = document.getElementById('radarChart').getContext('2d');
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
          if (this.selectedFocusAreas.indexOf(parseInt(key)) === -1 && key !== "grasbrook") {
            // ignore not selected areas
            continue
          }

          const focusArea = key
          let displayLabels = 'auto'
          if (Object.keys(this.abmStats).length < 2) {
            displayLabels = focusArea === "grasbrook" ? 'auto' : true  // prioritize stats for focusArea over grasbrook
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
                let val = context.chart.data.datasets[context.datasetIndex].notes["originalValues"][context.dataIndex]
                if (context.hovered) {
                  // Adds a unit to the value , if hovered
                  unitString = ' ' + context.chart.data.datasets[context.datasetIndex].notes["units"][context.dataIndex]
                }
                return val.toString() + unitString;
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
        this.radarChartReady = true
        this.updateRadarChart = false
      }
    },
      computed: {
        ...mapState('scenario', ['selectedFocusAreas']), // getter only
        ...generateStoreGetterSetter([
          ['loader', 'scenario/loader'],
          ['updateRadarChart', 'scenario/updateRadarChart'],
          ['updateAmenityStatsChart', 'scenario/updateAmenityStatsChart'],
          ['abmStats', 'scenario/abmStats'],
          ['amenityStats', 'scenario/amenityStats']
        ])
    },
    watch: {
      updateRadarChart() {
        console.log("updating the chart")
        if (this.updateRadarChart) {
          this.renderRadarChart()
        }
      },
      updateAmenityStatsChart() {
        console.log("updating the BAR chart")
        if (this.updateAmenityStatsChart) {
          this.renderBarChart()
        }
      }
    }
}

</script>

<template>
  <div class="charts">
    <div v-show="this.amenityStats && this.barChartReady" class="bar_chart">
      <canvas id="barChart" width="500" height="400"></canvas>
    </div>
    <div v-show="this.abmStats && this.radarChartReady" class="radar_chart" style="margin-top: 20px;">
      <h3>Activity Index</h3>
      <canvas id="radarChart" width="500" height="600"></canvas>
    </div>
  </div>

</template>

<style scoped lang="scss">
    @import "../../style.main.scss";

</style>
