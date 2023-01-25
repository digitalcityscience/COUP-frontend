<script lang="ts">
import { mapState } from "vuex";
import Chart from "chart.js/auto";
import { color } from "chart.js/helpers";
import ChartDataLabels from "chartjs-plugin-datalabels";
Chart.unregister(ChartDataLabels);
import { generateStoreGetterSetter } from "@/store/utils/generators";
import { calculateAmenityStatsForFocusArea } from "@/store/scenario/amenityStats";
import { calculateAbmStatsForFocusArea } from "@/store/scenario/abmStats";
const chartColors: Record<string | number, string> = {
  grasbrook: "lightgrey",
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
  12: "#70b6c9",
};
export default {
  name: "DashboardCharts",
  data() {
    return {
      radarChart: null,
      barChart: null,
      radarChartReady: false,
      barChartReady: false,
    };
  },
  mounted() {
    // check if stats already computed
    if (!this.abmStats["grasbrook"]) {
      // calculate stats
      calculateAmenityStatsForFocusArea();
      calculateAbmStatsForFocusArea();
    } else {
      // render charts for stats
      this.renderBarChart();
      this.renderRadarChart();
    }
  },
  methods: {
    renderBarChart() {
      this.barChartReady = false;

      // destroy the old chart
      if (this.barChart) {
        this.barChart.destroy();
      }

      if (Object.keys(this.amenityStats).length === 0) {
        // no stats, no chart
        return;
      }
      console.log("rendering bar chart");

      /*render graph via chart.js*/
      var ctx = (
        document.getElementById("barChart") as HTMLCanvasElement
      ).getContext("2d");
      // create datasets
      let datasets = [];
      let units = this.amenityStats["units"];

      for (const [key, results] of Object.entries(this.amenityStats)) {
        if (key === "units") {
          // ignore units
          continue;
        }
        if (
          this.selectedFocusAreas.indexOf(parseInt(key)) === -1 &&
          key !== "grasbrook"
        ) {
          // ignore not selected areas
          continue;
        }
        const focusArea = key;

        let dataset = {
          data: Object.values(results),
          label: "Focus Area: " + focusArea.toString(),
          backgroundColor: chartColors[focusArea],
          borderColor: chartColors[focusArea],
          hoverBackgroundColor: chartColors[focusArea],
          hoverBorderColor: chartColors[focusArea],
          maxBarThickness: 20,
          notes: {
            originalValues: Object.values(results),
            units: units,
          },
          datalabels: {
            color: "lightgrey",
            anchor: "end",
            align: "end",
          },
        };
        datasets.push(dataset);
      }
      let labels = Object.keys(this.amenityStats["grasbrook"]);

      this.barChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: "bar",
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          indexAxis: "y", // this makes the chart behive like a horizontalBar
          scales: {
            x: {
              stacked: false,
              grid: {
                color: "rgba(49,48,73,0.35)",
              },
            },
            y: {
              stacked: false,
              grid: {
                color: "rgba(49,48,73,0.35)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function (tooltipItem) {
                  //This will be the tooltip.body
                  const value = tooltipItem.dataset.data[tooltipItem.dataIndex];
                  const unit = units[tooltipItem.dataIndex];
                  return value.toString() + " " + unit;
                },
              },
            },
          },
        },
      });
      this.barChartReady = true;
      this.updateAmenityStatsChart = false;
    },
    /** radar chart for abmStats
     * TODO refactor as chart maker service
     * **/
    renderRadarChart() {
      this.radarChartReady = false;

      // destroy the old chart
      if (this.radarChart) {
        this.radarChart.destroy();
      }

      if (Object.keys(this.abmStats).length === 0) {
        // no stats, no chart
        return;
      }

      /*render graph via chart.js*/
      const ctx = (
        document.getElementById("radarChart") as HTMLCanvasElement
      ).getContext("2d");

      // create datasets
      let datasets = [];
      let units = this.abmStats["units"];

      for (const [key, results] of Object.entries(this.abmStats)) {
        if (key === "units") {
          // ignore units
          continue;
        }
        if (
          this.selectedFocusAreas.indexOf(parseInt(key)) === -1 &&
          key !== "grasbrook"
        ) {
          // ignore not selected areas
          continue;
        }

        const focusArea = key;
        let displayLabels = "auto";
        if (Object.keys(this.abmStats).length < 2) {
          displayLabels = focusArea === "grasbrook" ? "auto" : "true"; // prioritize stats for focusArea over grasbrook
        }
        const colorToUse = color(chartColors[focusArea]);
        let dataset = {
          data: Object.values(results["scaledResults"]),
          label: "Focus Area: " + focusArea.toString(),
          backgroundColor: colorToUse.alpha(0.2).rgbString(),
          hoverBackgroundColor: colorToUse.alpha(0.2).rgbString(),
          borderColor: colorToUse.rgbString(),
          pointBackgroundColor: colorToUse.alpha(0.2).rgbString(),
          notes: {
            originalValues: Object.values(results["original"]),
            units: units,
          },
          datalabels: {
            // Appear when hovering over the value annotation
            display: displayLabels,
            color: chartColors[focusArea],
            anchor: "end",
            align: "end",
            offset: "35",
            formatter: function (value, context) {
              let unitString = "";
              let val =
                context.chart.data.datasets[context.datasetIndex].notes[
                  "originalValues"
                ][context.dataIndex];
              if (context.hovered) {
                // Adds a unit to the value , if hovered
                unitString =
                  " " +
                  context.chart.data.datasets[context.datasetIndex].notes[
                    "units"
                  ][context.dataIndex];
              }
              return val.toString() + unitString;
            },
            listeners: {
              enter: function (context) {
                // Receives `enter` events for any labels of any dataset. Indices of the
                // clicked label are: `context.datasetIndex` and `context.dataIndex`.
                // For example, we can modify keep track of the hovered state and
                // return `true` to update the label and re-render the chart.
                context.hovered = true;
                return true;
              },
              leave: function (context) {
                // Receives `leave` events for any labels of any dataset.
                context.hovered = false;
                return true;
              },
            },
          },
        };
        datasets.push(dataset);
      }
      let labels = Object.keys(this.abmStats["grasbrook"]["scaledResults"]);

      this.radarChart = new Chart(ctx, {
        plugins: [ChartDataLabels],
        type: "radar",
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: {
          scales: {
            r: {
              grid: {
                display: true,
                circular: true,
                color: "#444",
              },
              pointLabels: {
                display: false,
              },
              beginAtZero: true,
              ticks: {
                display: false,
                callback: function () {
                  return "";
                },
                backdropColor: "rgba(0, 0, 0, 0)",
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            // Appears when hovering on the datapoint.
            tooltip: {
              enabled: true,
              callbacks: {
                title: function (tooltipItem) {
                  return tooltipItem[0].label;
                },
                label: function (tooltipItem) {
                  //This will be the tooltip.body
                  // @ts-ignore
                  const value = tooltipItem.dataset.notes.originalValues[tooltipItem.dataIndex];
                  const unit = units[tooltipItem.dataIndex];
                  return value.toString() + " " + unit;
                },
              },
            },
          },
        },
      });
      this.radarChartReady = true;
      this.updateAbmStatsChart = false;
    },
  },
  computed: {
    ...mapState("scenario", ["selectedFocusAreas"]), // getter only
    ...mapState("abm", ["abmStats"]), // getter only
    ...mapState("abm", ["amenityStats"]), // getter only
    ...generateStoreGetterSetter([
      ["loader", "scenario/loader"],
      ["updateAbmStatsChart", "scenario/updateAbmStatsChart"],
      ["updateAmenityStatsChart", "scenario/updateAmenityStatsChart"],
    ]),
  },
  watch: {
    updateAbmStatsChart() {
      console.log("updating the chart");
      if (this.updateAbmStatsChart) {
        this.renderRadarChart();
      }
    },
    updateAmenityStatsChart() {
      console.log("updating the BAR chart");
      if (this.updateAmenityStatsChart) {
        this.renderBarChart();
      }
    },
  },
};
</script>

<template>
  <div>
    <div class="charts">
      <div v-show="this.amenityStats && this.barChartReady" class="bar_chart">
        <h3>Amenity Statistics</h3>
        <canvas id="barChart" width="500" height="400"></canvas>
      </div>

      <div
        v-show="this.abmStats && this.radarChartReady"
        class="radar_chart"
        style="margin-top: 20px"
      >
        <h3>Activity Index</h3>
        <canvas id="radarChart" width="500" height="600"></canvas>
      </div>
    </div>
    <h2>Pedestrian Flow | Glossary</h2>
    <div class="info_section">
      <div class="info_text">
        <h3>Amenity Statistics</h3>
        <p>
          <strong>Density</strong> of amenities is understood as the quantity of elements
          by the unit of area and is known to be a key condition for urban activeness.
        </p>
        <p>
          <strong>Amenity Types</strong> shows the different types of amenities present 
          in the area.
        </p>
        <p>
          <strong>Diversity</strong> as Simpson diversity index [0-100]. 
          Heterogeneous uses and functions foster the mix of people and social interaction by
          avoiding monofunctional and sectorized areas. 
        </p>
        <p>
          <strong>Complementarity</strong> is understood as the capacity of some types of amenities
          to complete others, potentially creating a sequence of actions, e.g. walking from
          a restaurant to a café.
        </p>
      </div>
      <div class="info_text">        
        <h3>Pedestrian Statistics</h3>
        <p>
          <strong>Pedestrian Density</strong> is the amount of pedestrians per m² of the area.
        </p>
        <p>
          <strong>Trip Length</strong> is the average of the distance that a
          pedestrian walks.
        </p>
        <p>
          <strong>Trip Duration</strong> is s the average length of time that a pedestrian is present in a public space.
        </p>  
        <p>
          <strong>Temporal entropy</strong> shows the relative evenness of the temporal distribution of movements. 
          A high temporal entropy describes a pedestrian activity throughout the day, instead of only in peak hours.
        </p>  
        <p>
          <strong>Opportunities of interaction</strong> is each pedestrian's exposure to semi-random social interactions. 
          These interactions correlate to mental health indicators. Many interactions per m² describe a lively neighborhood.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";



.charts {
  .bar_chart,
  .radar_chart {
    position: relative;
    margin: 5px auto;
    padding: 5px;
    box-sizing: border-box;
    @include drop_shadow;

    h3 {
      font-size: 90%;
      color: #ccc;
      font-weight: 300;
      text-align: left;
      margin-left: 5px;
    }

    /* content overlay destroys interaction with chart canvas (hover, tooltips, ..)
          &:after {
          content:'';
          position:absolute;
          top:0;
          left:0;
          width:100%;
          height:100%;
          background:$reversed;
          opacity:0.05;
        } */
  }
}
</style>
