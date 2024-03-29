<script lang="ts">
import _ from "lodash";
import type {
  StoreStateWithModules,
  ScenarioWithTimeSheets,
  fiveMinuteAgentSummary,
  TimeSheetContext,
  DataForAbmTimeGraph,
} from "@/models";
import {
  abmTripsLayerName,
  setAnimationTimeAbm,
} from "@/services/deck.service";
import { Chart } from "chart.js";
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import type { Store } from "vuex";
import SWTimeSheet from "@/components/Scenario/SWTimeSheet.vue";
import TimeSheetControl from "@/components/Scenario/TimeSheetControl.vue";

@Component({
  components: { SWTimeSheet, TimeSheetControl },
})
export default class TimeSheet extends Vue {
  $store: Store<StoreStateWithModules>;

  timeChart = null;
  currentTimeStamp = null;
  animationSpeed = 3;
  heatMapRange = { left: "0%", width: "100%" };
  minTime = 0;
  showGraph = true;

  @Prop({})
  timeSheetContext: TimeSheetContext;

  /** connected to play button in time sheet control */
  toggleAnimation(): void {
    this.animateTripsLayer = !this.animateTripsLayer;
    if (this.animateTripsLayer) {
      this.playTripsLayerAnimation();
    }
  }

  /**
   * Executes the trips layer animation
   * while this.animateTripsLayer === true
   * --> functionality for play button
   **/
  playTripsLayerAnimation(): void {
    // TODO: Once ABM is automated, get start/end times from API.
    const abmTimeRange = this.$store.state.abm.timeRange;
    const start = (abmTimeRange[0] - 8) * 3600; // ABM result starts at 8am, time in seconds since then.
    const end = (abmTimeRange[1] - 8) * 3600; // ABM result starts at 8am, time in seconds since then.

    // TODO adjust timestamp to slider. or slider to abm logic.
    this.currentTimeStamp = this.currentTimeStamp || start;

    // increase animation 1 step. 1 step = 7 seconds per animationSpeed
    this.currentTimeStamp = this.currentTimeStamp + this.animationSpeed * 7;
    if (this.currentTimeStamp + this.animationSpeed * 7 >= end) {
      this.currentTimeStamp = start;
    }

    // the animation is realized by
    // updating the currentTime rendering variable on the layer
    const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
    setAnimationTimeAbm(
      (deckLayer as any).implementation,
      this.currentTimeStamp
    );

    // trigger next cycle
    window.requestAnimationFrame(() => {
      if (this.animateTripsLayer) {
        this.playTripsLayerAnimation();
      }
    });
  }

  renderTimeGraph() {
    // is rerendered now.
    this.timeSheetNeedsRerender = false;

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
        labels: this.timeSheetData.labels,
        datasets: [
          {
            data: this.timeSheetData.values,
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
  get timeSheetNeedsRerender(): boolean {
    return this.$store.state.abm.timeSheetNeedsRerender;
  }
  set timeSheetNeedsRerender(needsRerendering: boolean) {
    this.$store.commit("abm/mutateTimeSheetNeedsRerender", needsRerendering);
  }

  /** animate trips layer */
  get animateTripsLayer(): boolean {
    return this.$store.state.abm.animateLayer;
  }
  set animateTripsLayer(newValue: boolean) {
    this.$store.commit("abm/mutateAnimateLayer", newValue);
  }

  /** time sheet data */
  get hasTimeSheetData(): boolean {
    return !_.isEmpty(this.$store.state.abm.dataForTimeGraph);
  }
  get timeSheetData(): DataForAbmTimeGraph {
    return this.$store.state.abm.dataForTimeGraph;
  }

  get abmTimeRange() {
    return this.$store.state.abm.timeRange;
  }

  // UI can be hidden by Toggle UI button in viewbar menu
  get showUi(): boolean {
    return this.$store.state.scenario.showUi;
  }

  increaseAnimationSpeed(): number {
    if (this.animationSpeed <= 3) {
      return (this.animationSpeed += 1);
    } else {
      return 1;
    }
  }

  /** WATCHERS */
  @Watch("timeSheetNeedsRerender")
  timeSheetNeedsRerenderWatcher(): void {
    if (this.timeSheetNeedsRerender) {
      this.renderTimeGraph();
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
      :hidden="timeSheetContext !== 'abm' || !hasTimeSheetData"
      :class="{ dismiss: timeSheetContext !== 'abm' }"
    >
      <div
        class="time_panel panel"
        :class="{
          dismiss: timeSheetContext !== 'abm' || !showGraph,
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
            animation speed<strong> x{{ animationSpeed }}</strong>
          </p>
        </div>
      </div>
      <TimeSheetControl
        v-if="timeSheetContext === 'abm'"
        @toggle-animation="toggleAnimation"
        :animation-running="animateTripsLayer"
        :animationSpeed="animationSpeed"
        :allowSpeedControl="true"
        @increaseAnimationSpeed="animationSpeed = increaseAnimationSpeed()"
        @toggle-graph="showGraph = $event"
      />
    </span>
    <!-- 
      TODO : why is abm sheet hidden with vif 
      and sw time sheet hidden with "hidden" prob?
    -->
    <SWTimeSheet
      :hidden="timeSheetContext !== 'stormwater'"
      :class="{ dismiss: timeSheetContext !== 'stormwater' }"
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
