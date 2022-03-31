<script lang="ts">
import _ from "lodash";
import type { StoreStateWithModules, ScenarioWithTimeSheets, AgentsClusteredForTimeGraph, fiveMinuteAgentSummary } from "@/models";
import {
  abmTripsLayerName,
  setAnimationTimeAbm,
} from "@/services/deck.service";
import { Chart } from "chart.js";
import { Component, Vue, Watch } from "vue-property-decorator";
import type { Store } from "vuex";
import SWTimeSheet from "@/components/Scenario/SWTimeSheet.vue";
import TimeSheetControl from "@/components/Scenario/TimeSheetControl.vue";

@Component({
  components: { SWTimeSheet, TimeSheetControl },
})
export default class TimeSheet extends Vue {
  $store: Store<StoreStateWithModules>;

  timeChart = null;
  animationSpeed = 21;
  timeStamps = [];
  timeCoords = [];
  timeHours = [];
  heatMapRange = { left: "0%", width: "100%" };
  minTime = 0;
  showGraph = true;

  toggleAnimation(): void {
    this.animateTripsLayer = !this.animateTripsLayer;
    if (this.animateTripsLayer) {
      this.autoLoopAnimation();
    }
  }

  autoLoopAnimation(): void {
    /*functionality for play button*/

    // TODO: Once ABM is automated, get start/end times from API.
    const abmTimeRange = this.$store.state.scenario.abmTimeRange;
    const start = (abmTimeRange[0] - 8) * 3600; // ABM result starts at 8am, time in seconds since then.
    const end = (abmTimeRange[1] - 8) * 3600; // ABM result starts at 8am, time in seconds since then.

    // TODO adjust timestamp to slider. or slider to abm logic.
    this.currentTimeStamp = this.currentTimeStamp || start;

    // increase animation time by 1 step
    this.currentTimeStamp = this.currentTimeStamp + this.animationSpeed;
    if (this.currentTimeStamp + this.animationSpeed >= end) {
      this.currentTimeStamp = start;
    }

    /*
      the animation is realized by
      updating the currentTime rendering variable on the layer
    */
    const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
    setAnimationTimeAbm(
      (deckLayer as any).implementation,
      this.currentTimeStamp
    );

    // trigger next cycle
    window.requestAnimationFrame(() => {
      if (this.animateTripsLayer) {
        this.autoLoopAnimation();
      }
    });
  }

  getDataForTimeChart() {
    this.timeStamps = [];
    this.timeCoords = [];

    Object.entries(this.timeSheetData).forEach((entry: [string, fiveMinuteAgentSummary]) => {
      const [key, value] = entry;

      let label = Math.floor(Number(key) / 3600) + 8 + ":00";
      let coords = [...new Set(value.all)];

      this.timeStamps.push(label);
      this.timeCoords.push(coords.length);
    });

    this.renderTimeGraph();
  }

  renderTimeGraph() {
    this.reRenderTimeSheet = false;

    /*render graph via chart.js*/
    var ctx = (
      document.getElementById("timeChart") as HTMLCanvasElement
    ).getContext("2d");
    if (this.timeChart) {
      this.timeChart.destroy();
    }

    this.timeChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: this.timeStamps,
        datasets: [
          {
            data: this.timeCoords,
            //borderColor: 'rgba(253, 128, 93, 1)',
            borderColor: "rgba(16,245,229,1)",
            backgroundColor: "rgba(0,0,0,0.75)",
            borderWidth: 1,
            fill: false,
            label: "all Agents",
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(49,48,73,0.35)",
            },
          },
          x: {
            grid: {
              color: "rgba(49,48,73,0.35)",
            },
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

  /*change Time via Slider*/
  changeCurrentTime(newTime: number): void {
    this.currentTimeStamp = newTime;

    if (this.animateTripsLayer) {
      /*reanimate abm Tripslayer with new currentTime*/
      const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
      setAnimationTimeAbm((deckLayer as any).implementation, newTime);
    }
  }


  /** GETTERS & SETTERS */

  get currentTimeStamp(): number {
    return this.$store.state.scenario.currentTimeStamp;
  }
  set currentTimeStamp(updatedTime: number) {
    this.$store.commit("scenario/currentTimeStamp", updatedTime);
  }

  get reRenderTimeSheet(): boolean {
    console.log("rerender? ", this.$store.getters["abm/reRenderAbmTimeSheet"])
    return this.$store.getters["abm/reRenderAbmTimeSheet"];
  }
  set reRenderTimeSheet(needsRerendering: boolean) {
    this.$store.commit("abm/mutateReRenderTimeSheet", needsRerendering);
  }

  /** animate trips layer */
  get animateTripsLayer(): boolean {
    return this.$store.getters["abm/animateAbmTripsLayer"];
  }
  set animateTripsLayer(newValue: boolean) {
    this.$store.commit("abm/mutateAnimateLayer", newValue);
  }

  /** time sheet data */
  get hasTimeSheetData(): boolean {
    return !(_.isEmpty(this.$store.getters["abm/abmDataForTimeGraph"]))
  }
  get timeSheetData(): AgentsClusteredForTimeGraph {
    return this.$store.getters["abm/abmDataForTimeGraph"];
  }


  // TODO refactor
  get abmTimeRange() {
    return this.$store.state.scenario.abmTimeRange;
  }
  get heatMapActive() {
    return this.$store.state.scenario.heatMap;
  }
  
  // when is this used??
  get showUi(): boolean {
    return this.$store.state.scenario.showUi;
  }

  // when is this used??
  get stormWater() {
    return this.$store.state.scenario.stormWater;
  }


  // TODO hand prop to component in order to decide which graph to show
  get selectGraph(): ScenarioWithTimeSheets {
    console.log("selectGraph in store", this.$store.state.scenario.selectGraph)

    return this.$store.state.scenario.selectGraph;
  }

  @Watch("reRenderTimeSheet")
  reRenderTimeSheetWatcher(): void {
    if (this.reRenderTimeSheet) {
      this.getDataForTimeChart();
    }
  }

  // TODO can be deleted??
  @Watch("heatMapActive")
  heatMapActiveWatcher() {
    if (this.heatMapActive) {
      this.$store.commit("scenario/animateTripsLayer", false);
    }
  }

  @Watch("abmTimeRange")
  selectedRangeWatcher(): void {
    var leftVal = (this.abmTimeRange[0] - 8) * 60 * 60;
    var rightVal = (this.abmTimeRange[1] - 8) * 60 * 60;

    this.heatMapRange.left = (leftVal * 100) / 57600 + "%";
    this.heatMapRange.width = ((rightVal - leftVal) * 100) / 57600 + "%";
  }
}
</script>

<template>
  <div
    id="timesheet"
    :class="{
      ui_hide: !showUi,
    }"
  >
    <span
      :hidden="selectGraph !== 'abm' || !hasTimeSheetData"
      :class="{ dismiss: selectGraph !== 'abm' }"
    >
      <div
        class="time_panel panel"
        :class="{
          dismiss: selectGraph !== 'abm' || !showGraph,
        }"
      >
        <div class="time_graph">
          <canvas id="timeChart" width="300" height="200"></canvas>
        </div>
        <div class="time_slider slider">
          <div id="run_slider">
            <v-slider
              thumb-label="always"
              :min="minTime"
              :max="57600"
              :value="currentTimeStamp"
              @change="changeCurrentTime"
            ></v-slider>
          </div>
          <div
            class="range_slider"
            :style="{ left: heatMapRange.left, width: heatMapRange.width }"
          >
            >
          </div>
        </div>
        <div class="animation_info">
          <p>
            animation speed<strong> x{{ animationSpeed / 7 }}</strong>
          </p>
        </div>
      </div>
      <TimeSheetControl
        v-if="selectGraph === 'abm'"
        @toggle-animation="toggleAnimation"
        :animation-running="animateTripsLayer"
        @animationSpeed="animationSpeed = $event"
        @toggle-graph="showGraph = $event"
      />
    </span>
    <SWTimeSheet
      :hidden="selectGraph !== 'sw'"
      :class="{ dismiss: selectGraph !== 'sw' }"
      :controls="selectGraph === 'sw'"
    />
  </div>
</template>

<style scoped lang="scss">
@import "@/style.main.scss";

#timesheet {
  position: fixed;
  bottom: 10px;
  left: 10px;
  width: 325px;
  height: auto;
  max-height: 280px;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  box-sizing: border-box;
  @include drop_shadow;

  &.ui_hide {
    transform: translateX(-100vw);
    transition: 0.3s;
  }

  h3 {
    width: 100%;
    text-align: right;
    font-family: "Tajawal", sans-serif;
    margin: 3px auto;
    font-size: 90%;
    color: #ccc;
    font-weight: 100;

    strong {
      font-size: 100%;
      font-weight: 500;
      color: whitesmoke;
      padding-right: 10px;
    }
  }

  .panel {
    display: block;
    position: relative;
    opacity: 1;
    z-index: 1;
    pointer-events: all;

    &.dismiss {
      position: absolute;
      opacity: 0;
      z-index: -5;
      pointer-events: none;
    }
  }

  .time_panel {
    width: 300px;

    .time_graph {
      background: rgba(0, 0, 0, 0.5);
    }
    .time_slider {
      position: relative;
      width: 265px;
      margin: 0px 0px 0px auto;

      #run_slider {
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

      .range_slider {
        position: absolute;
        height: 160px;
        bottom: 70px;
        background: rgba(255, 255, 255, 0.15);
      }
    }

    .animation_info {
      text-align: right;
      opacity: 0.5;
      p {
        color: $bright2;
        font-size: 80%;

        strong {
          color: $bright1;
        }
      }
    }
  }

  @media (max-device-width: 720px) {
    width: calc(100% - 20px);
    left: 10px;
    max-width: 100vw;
    background: transparent;
    z-index: 10;

    .time_panel {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(5px);
      width: 100%;
      left: 0;
      padding: 10px;
      box-sizing: border-box;
      transform: translateY(100vh);

      .time_slider {
        width: 90%;
      }
    }
  }
}
</style>
