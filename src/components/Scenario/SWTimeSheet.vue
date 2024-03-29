<template>
  <div>
    <div
      class="sw_panel panel"
      :class="{
        show: mobileTimePanel,
        dismiss: !stormWaterResult || !mobileTimePanel,
      }"
    >
      <div class="sw_graph">
        <canvas id="rainChart" width="300" height="40"></canvas>
        <canvas id="swChart" width="300" height="200"></canvas>
        <div class="sw_slider slider">
          <div id="rain_slider">
            <v-slider
              v-model="rainTime"
              :max="buildingsRunOffResults.length"
              min="0"
              hide-details
              dark
              @change="updateSWLayer()"
            ></v-slider>
          </div>
        </div>
      </div>
    </div>
    <TimeSheetControl
      v-if="stormWaterResult"
      @toggle-animation="toggleAnimation"
      :animationRunning="animateLayer"
      :allowSpeedControl="false"
      @toggle-graph="mobileTimePanel = $event"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import type {
  StoreStateWithModules,
  GeoJSON,
  StormWaterResult,
  MapboxMap,
} from "@/models";
import type { Store } from "vuex";
import { Chart } from "chart.js";
import TimeSheetControl from "@/components/Scenario/TimeSheetControl.vue";
import { buildSWLayer, setAnimationTimeAbm } from "@/services/deck.service";
import { addDeckLayerToMap } from "@/services/map.service";

@Component({
  components: { TimeSheetControl },
})
export default class SWTimeSheet extends Vue {
  $store: Store<StoreStateWithModules>;

  mobileTimePanel = false;
  rainTime = 0; // time in slider for stormwater
  buildingsRunOffResults = [];
  rainChart: Chart | null = null;
  swChart: Chart | null = null;
  swTimeStamps = [];
  parksRunOffResults = [];
  streetsRunOffResults = [];

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get stormWaterResult(): StormWaterResult {
    return this.$store.state.stormwater.result;
  }

  get rerenderSwGraph(): boolean {
    return this.$store.state.scenario.rerenderSwGraph;
  }

  set rerenderSwGraph(newValue: boolean) {
    this.$store.commit("scenario/rerenderSwGraph", newValue);
  }

  get animateLayer(): boolean {
    return this.$store.getters["stormwater/animateStormWaterLayer"];
  }

  set animateLayer(newValue: boolean) {
    this.$store.commit("stormwater/mutateAnimateLayer", newValue);
  }

  autoLoopAnimation(): void {
    const max = this.buildingsRunOffResults.length;
    this.rainTime += 1;
    if (this.rainTime >= max) {
      this.rainTime = 0;
    }
    this.updateSWLayer();

    window.requestAnimationFrame(() => {
      if (this.animateLayer) {
        this.autoLoopAnimation();
      }
    });
  }

  /* build new layer and replace current stormwater layer
   INFO: the deck.gl polygon layer has no rendering property
   like currentTime (like for ABM trips layer) that could be updated on the existing layer
  */
  updateSWLayer(): void {
    this.$store.dispatch("stormwater/updateStormWaterLayer", [
      this.map,
      this.rainTime,
    ]);
  }

  toggleAnimation(): void {
    this.animateLayer = !this.animateLayer;

    if (this.animateLayer) {
      this.autoLoopAnimation();
    }
  }

  @Watch("rerenderSwGraph")
  rerenderSwGraphWatcher(): void {
    if (this.rerenderSwGraph) {
      this.prepareDataForRunOffGraph().then(() => {
        this.renderSWGraphRunOff();
        this.renderSWGraphRain();
      });
    }

    this.rerenderSwGraph = false;
  }

  async prepareDataForRunOffGraph(): Promise<boolean> {
    this.buildingsRunOffResults = [];
    this.streetsRunOffResults = [];
    this.parksRunOffResults = [];

    // make time stamps and run off results
    const features = this.stormWaterResult.geojson.features as any[];

    // calculate total runoff for each point in time
    // iterate over every subcatchment result and add the results to the accumulated up values for the subcatchment type
    features.forEach((subcatchmentResult) => {
      const subcatchmentType = subcatchmentResult.properties["type_sub"]; // e.g. park
      if (subcatchmentResult.properties["runoff_results"]) {
        switch (subcatchmentType) {
          case "B_C": // building commercial
          case "B_R": // building residential
          case "B_S": // building special
            this.addSubcatchmentResultToAccumulatedRunOffs(
              this.buildingsRunOffResults,
              subcatchmentResult
            );
            break;
          case "PT_park":
          case "PT_promenade":
          case "PT_plaza":
          case "S_playground":
            this.addSubcatchmentResultToAccumulatedRunOffs(
              this.parksRunOffResults,
              subcatchmentResult
            );
            break;
          case "T_street": // streets
            this.addSubcatchmentResultToAccumulatedRunOffs(
              this.streetsRunOffResults,
              subcatchmentResult
            );
            break;
          default:
            console.error(
              "got an unknown subcatchment type in stormwater result: ",
              subcatchmentType
            );
        }
      }
    });
    return true;
  }

  addSubcatchmentResultToAccumulatedRunOffs(totalRunOff, subCatchmentResult) {
    const timestamps =
      subCatchmentResult.properties["runoff_results"]["timestamps"];
    // iterate over every time stamp and add the result to runOffTotal at that time
    timestamps.forEach((timestamp) => {
      if (timestamp > 120) {
        // ignore all timestamps > 120, to display only relevant data.
        return;
      }
      if (!totalRunOff[timestamp]) {
        totalRunOff[timestamp] = 0; // 0 if no runOff Total yet
      }
      // TODO potentially we need to convert runoff value into another unit
      // sum up the run off value for each feature at a point in time
      totalRunOff[timestamp] +=
        subCatchmentResult.properties["runoff_results"]["runoff_value"][
          timestamp
        ];
    });
  }

  // runOff graph
  renderSWGraphRunOff() {
    var ctxSW = (
      document.getElementById("swChart") as HTMLCanvasElement
    ).getContext("2d");

    if (this.swChart) {
      this.swChart.destroy();
    }

    // make strings like "2:30" to show elapsed time in hours
    this.swTimeStamps = Array.from(
      Array(this.buildingsRunOffResults.length).keys()
    );
    this.swTimeStamps = this.swTimeStamps.map(
      (num) =>
        Math.floor(num / 60) + // full hours
        ":" +
        (num % 60 >= 30 ? "30" : "00") // group to 30min bits.
    );

    /* debugging info

          console.warn("accumulated runoff values buildings",
           this.buildingsRunOffResults
          )
          console.warn("accumulated runoff values streets",             this.streetsRunOffResults
          )
          console.warn("accumulated runoff values parks",
            this.parksRunOffResults
         )

          console.warn("max runoff values",
            Math.max(...this.buildingsRunOffResults),
            Math.max(...this.streetsRunOffResults),
            Math.max(...this.parksRunOffResults)
          )
        */

    const yAxixMax = 600; // for now this seems to be max. aggregated runoff for 1 space type.

    this.swChart = new Chart(ctxSW, {
      type: "line",
      data: {
        labels: this.swTimeStamps,
        datasets: [
          {
            data: this.buildingsRunOffResults,
            //borderColor: 'rgba(253, 128, 93, 1)',
            borderColor: "rgba(16,245,229,1)",
            backgroundColor: "rgba(0,0,0,0.75)",
            borderWidth: 1,
            fill: false,
            label: "Buildings",
          },
          {
            data: this.parksRunOffResults,
            label: "Plazas & Parks",
            borderColor: "rgba(81,209,252,0.85)",
            borderWidth: 1,
            fill: true,
          },
          {
            data: this.streetsRunOffResults,
            label: "Streets",
            borderColor: "rgba(10,171,135,0.85)",
            borderWidth: 1,
            fill: true,
          },
        ],
      },
      options: {
        scales: {
          y: {
            max: yAxixMax,
            title: {
              display: true,
              text: "Runoff (LPS)",
            },
            grid: {
              color: "rgba(49,48,73,0.35)",
            },
            beginAtZero: true,
            suggestedMax: yAxixMax,
            ticks: {
              stepSize: yAxixMax / 10,
              maxTicksLimit: 10,
              display: false,
            },
          },
          x: {
            title: {
              display: true,
              text: "storm duration in hours",
            },
            grid: {
              color: "rgba(49,48,73,0.35)",
            },
            beginAtZero: true,
          },
        },
        elements: {
          point: {
            radius: 0,
          },
          line: {
            tension: 1,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }

  renderSWGraphRain() {
    console.log("rain gage", this.stormWaterResult.rainData);

    var ctxR = (
      document.getElementById("rainChart") as HTMLCanvasElement
    ).getContext("2d");

    if (this.rainChart) {
      this.rainChart.destroy();
    }

    this.rainChart = new Chart(ctxR, {
      type: "bar",
      data: {
        //labels: Array.from(Array(rainDataMinutes.length).keys()),
        labels: Array.from(Array(this.stormWaterResult.rainData.length).keys()),
        datasets: [
          {
            data: this.stormWaterResult.rainData,
            //borderColor: 'rgba(16,245,229,1)',
            backgroundColor: "rgba(255,255,255,0.5)",
            //            fill: true,
            //label: 'mm/m²',
          },
        ],
      },
      options: {
        scales: {
          x: {
            grid: {
              display: false,
              color: "rgba(49,48,73,0.35)",
            },
            beginAtZero: true,
            ticks: {
              display: false,
            },
          },
          y: {
            max: 20,
            title: {
              display: true,
              //position: "right",
              text: "a", // just so the graph is rendered in the same place as the runoff graph..
            },
            grid: {
              display: false,
              color: "rgba(49,48,73,0.35)",
            },
            suggestedMax: 20,
            ticks: {
              stepSize: 1,
              maxTicksLimit: 48,
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }
}
</script>

<style lang="scss">
@import "@/style.main.scss";
.panel {
  display: block;
  position: relative;
  opacity: 1;
  z-index: 1;
  pointer-events: all;

  .sw_graph {
    position: relative;
    width: 300px;
    height: 200px;

    #swChart {
      position: absolute;
      bottom: 0;
      left: 0;
    }

    #rainChart {
      position: absolute;
      top: 0;
      left: 0;
      transform: scale(1, -1);
    }

    .sw_slider {
      position: relative;
      width: 260px;
      top: 162px;
      left: -8px;
      margin: 0px 0px 0px auto;

      #rain_slider {
        ::v-deep.v-input {
          .v-input__control {
            .v-input__slot {
              margin-bottom: 0px !important;
              .v-slider {
                margin: 0 !important;
                .v-slider__track-container {
                  background: radial-gradient(
                    rgba(255, 255, 255, 0.35),
                    rgba(255, 255, 255, 0.9)
                  );
                  .v-slider__track-background {
                    background: transparent !important;
                    border-color: $bright2 !important;
                  }
                  .v-slider__track-fill {
                    background: $opaqueorange !important;
                  }
                }

                .v-slider__thumb-container {
                  .v-slider__thumb {
                    width: 1px !important;
                    height: 177px !important;
                    background: rgba(255, 255, 255, 0.75) !important;
                    top: -177px;
                    left: 0;
                    transform: translate(0, 0);

                    &:hover {
                      cursor: grab;
                    }

                    &:after {
                      content: "";
                      position: absolute;
                      top: calc(100% - 4px);
                      left: 50%;
                      transform: translateX(-50%);
                      width: 8px;
                      height: 8px;
                      background: $orange;
                      border: 1px solid $bright1;
                      border-radius: 50%;
                    }
                  }
                  .v-slider__thumb-label-container {
                    display: none;
                  }
                }
              }
            }

            .v-messages {
              display: none;
            }
          }
        }
      }
    }
  }

  &.dismiss {
    position: absolute;
    opacity: 0;
    z-index: -5;
    pointer-events: none;
  }
}
</style>
