<script lang="ts">
import type { StoreStateWithModules, ScenarioWithTimeSheets } from "@/models";
import { abmTripsLayerName, animate } from "@/store/deck-layers";
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
  buildingsRunOffResults = [];
  currentTimeSet = 0;
  animationSpeed = 21;
  timeArray = {};
  timeStamps = [];
  timeCoords = [];
  timeHours = [];
  heatMapRange = { left: "0%", width: "100%" };
  filterCoords = [];
  activeAbmTimeCoords = [];
  transCoords = [];
  intervalNes = [];
  timeFilter = false;
  checkState = false;
  filter = null;
  filterLabels = [
    "Pedestrian",
    "Bicycle",
    "Public Transport",
    "Car",
    "No Filter",
  ];
  filterOptions = {
    Pedestrian: "foot",
    Bicycle: "bicycle",
    "Public Transport": "public_transport",
    Car: "car",
  };
  minTime = 0;
  maxTime = 0;
  currentTime = 0;
  loopSetter = false;
  windowWidth = window.innerWidth;
  mobileTimePanel = false;

  triggerAnimation(): void {
    /*functionality for play button*/
    const animationRunning = this.$store.state.scenario.animationRunning;
    this.$store.commit("scenario/animationRunning", !animationRunning);

    if (!animationRunning) {
      const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
      animate(
        (deckLayer as any).implementation,
        null,
        null,
        this.currentTimeStamp
      );
    }
  }

  getDataForTimeChart() {
    this.timeStamps = [];
    this.timeCoords = [];

    Object.entries(this.abmSimpleTimes).forEach((entry) => {
      const [key, value] = entry;
      let label = Math.floor(Number(key) / 3600) + 8 + ":00";
      let coords = [...new Set(value.all)];

      this.timeStamps.push(label);
      this.timeCoords.push(coords.length);
    });

    this.renderTimeGraph();
  }

  getFilteredDataForTimeChart() {
    this.activeAbmTimeCoords = [];
    Object.entries(this.abmSimpleTimes).forEach(([key, value]) => {
      this.transCoords = [];
      var spliceArr = [];

      Object.entries(this.filterSettings).forEach(
        ([filterKey, filterValue]) => {
          if (!filterValue) {
            spliceArr = [...new Set(value[filterKey]), ...spliceArr];
          }
        }
      );

      let removeDuplicates = [...new Set(value.all)];
      this.transCoords = removeDuplicates.filter(
        (el) => !spliceArr.includes(el)
      );
      this.activeAbmTimeCoords.push(this.transCoords.length);
    });
    this.renderTimeGraph();
  }

  renderTimeGraph() {
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
          {
            data: this.filterCoords,
            hidden: !this.timeFilter,
            label: "compared Agents",
            borderColor: "rgba(81,209,252,0.85)",
            borderWidth: 1,
            fill: true,
          },
          {
            data: this.activeAbmTimeCoords,
            hidden: !this.filterActive,
            label: "filtered Agents",
            borderColor: "rgba(10,171,135,0.85)",
            borderWidth: 1,
            fill: true,
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
  changeCurrentTime() {
    /*reanimate abm Tripslayer with new currentTime*/
    if (this.animationRunning) {
      const deckLayer = this.$store.state.map.getLayer(abmTripsLayerName);
      animate((deckLayer as any).implementation, null, null, this.currentTime);
    }
  }

  activateComparisonGraph() {
    this.timeFilter = true;
    this.filterCoords = [];

    if (this.filter === "No Filter") {
      // do not filter timeCoords
      this.filterCoords = [...this.timeCoords];
    } else {
      Object.values(this.abmSimpleTimes).forEach((value) => {
        let coords = [...new Set(value[this.filterOptions[this.filter]])];
        this.filterCoords.push(coords.length);
      });

      this.renderTimeGraph();
    }
    this.renderTimeGraph();
  }

  setLoop() {
    this.loopSetter = !this.loopSetter;
    this.$store.commit("scenario/setLoop", this.loopSetter);
  }

  get selectedRange() {
    return this.$store.state.scenario.selectedRange;
  }

  get abmTimePaths() {
    return this.$store.state.scenario.abmTimePaths;
  }

  get activeTimePaths() {
    return this.$store.state.scenario.activeTimePaths;
  }

  get abmSimpleTimes() {
    return this.$store.state.scenario.abmSimpleTimes;
  }

  get currentTimeStamp(): number {
    return this.$store.state.scenario.currentTimeStamp;
  }
  get filterSet() {
    return this.$store.state.scenario.clusteredAbmData;
  }
  get filterSettings() {
    return this.$store.state.scenario.filterSettings;
  }
  get activeAbmSet() {
    return this.$store.state.scenario.activeAbmSet;
  }
  get heatMapActive() {
    return this.$store.state.scenario.heatMap;
  }
  get animationRunning() {
    return this.$store.state.scenario.animationRunning;
  }
  get filterActive(): boolean {
    return this.$store.state.scenario.filterActive;
  }
  get showUi(): boolean {
    return this.$store.state.scenario.showUi;
  }
  get loop() {
    return this.$store.state.scenario.loop;
  }
  get stormWater() {
    return this.$store.state.scenario.stormWater;
  }
  // TODO hand prop to component in order to decide which graph to show
  get selectGraph(): ScenarioWithTimeSheets {
    return this.$store.state.scenario.selectGraph;
  }

  @Watch("activeAbmSet")
  activeAbmSetWatcher(): void {
    this.getDataForTimeChart();
  }

  @Watch("heatMapActive")
  heatMapActiveWatcher() {
    if (this.heatMapActive) {
      this.$store.commit("scenario/animationRunning", false);
    }
  }
  @Watch("currentTimeStamp")
  currentTimeStampWatcher() {
    this.currentTime = this.currentTimeStamp;
  }
  @Watch("selectedRange")
  selectedRangeWatcher(): void {
    var leftVal = (this.selectedRange[0] - 8) * 60 * 60;
    var rightVal = (this.selectedRange[1] - 8) * 60 * 60;

    this.heatMapRange.left = (leftVal * 100) / 57600 + "%";
    this.heatMapRange.width = ((rightVal - leftVal) * 100) / 57600 + "%";
  }

  @Watch("filterSettings", { deep: true })
  filterSettingsWatcher(): void {
    if (this.filterActive) {
      this.getFilteredDataForTimeChart();
    } else {
      this.activeAbmTimeCoords = [];
      this.renderTimeGraph();
    }
  }
}
</script>

<template>
  <div
    id="timesheet"
    :class="{
      ui_hide: !showUi || (activeAbmSet == null && stormWater == false),
    }"
  >
    <span
      :hidden="selectGraph !== 'abm'"
      :class="{ dismiss: selectGraph !== 'abm' }"
    >
      <div
        class="time_panel panel"
        :class="{ show: mobileTimePanel, dismiss: selectGraph !== 'abm' }"
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
              v-model="currentTime"
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
        @trigger-animation="triggerAnimation"
        :animationRunning="animationRunning"
        @animationSpeed="animationSpeed = $event"
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
  width: auto;
  height: auto;
  max-width: 360px;
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

      &.show {
        transform: translateY(0);
      }
    }
  }
}
</style>
