<script lang="ts">
import type { StoreStateWithModules } from "@/models";
import { abmTripsLayerName, animate } from "@/store/deck-layers";
import { Chart } from "chart.js";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Store } from "vuex";

@Component
export default class TimeSheet extends Vue {
  $store: Store<StoreStateWithModules>;

  timeChart = null;
  swChart = null;
  rainChart = null;
  buildingsRunOffResults = [];
  parksRunOffResults = [];
  streetsRunOffResults = [];
  currentTimeSet = 0;
  animationSpeed = 21;
  timeArray = {};
  swTimeStamps = [];
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
  rainTime = 0; // time in slider for stormwater
  swAnimationRunning = false;

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

  // update the time-dependend stormwater deck.gl layer, if the time in the slider changes.
  updateSWLayer() {
    this.$store.commit("scenario/rainTime", this.rainTime);
    this.$store.dispatch("scenario/updateSWLayerTime");
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

  async prepareDataForRunOffGraph() {
    this.buildingsRunOffResults = [];
    this.streetsRunOffResults = [];
    this.parksRunOffResults = [];

    // make time stamps and run off results
    const features = this.swResultGeoJson.features;

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
            /*ticks: {
                        beginAtZero: true
                        },*/
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
    console.log("rain gage", this.rainAmount);

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
        labels: Array.from(Array(this.rainAmount.length).keys()),
        datasets: [
          {
            data: this.rainAmount,
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
              text: "", // just so the graph is rendered in the same place as the runoff graph..
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
      },
    });
  }

  pauseAnimation() {
    this.$store.commit("scenario/animationRunning", false);
  }

  increaseAnimationSpeed() {
    if (this.animationSpeed <= 21) {
      this.animationSpeed += 7;
    } else {
      this.animationSpeed = 7;
    }

    this.$store.commit("scenario/animationSpeed", this.animationSpeed);
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

  autoLoopAnimation() {
    var animationSpeed = 1;
    var max = 288;

    if (this.swAnimationRunning) {
      if (this.rainTime + animationSpeed >= max) {
        this.rainTime = 0;
      } else {
        this.rainTime = this.rainTime + animationSpeed;
      }

      this.$store.commit("scenario/rainTime", this.rainTime);
      this.$store.dispatch("scenario/updateSWLayerTime");
      window.requestAnimationFrame(() => {
        this.autoLoopAnimation();
      });
    }
  }

  get rerenderSwGraph(): boolean {
    return this.$store.state.scenario.rerenderSwGraph;
  }

  set rerenderSwGraph(newValue: boolean) {
    this.$store.commit("scenario/rerenderSwGraph", newValue);
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
  get selectGraph() {
    return this.$store.state.scenario.selectGraph;
  }
  get swResultGeoJson() {
    return this.$store.state.scenario.swResultGeoJson;
  }
  get rainAmount() {
    return this.$store.state.scenario.rainAmount;
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
  @Watch("rerenderSwGraph")
  rerenderSwGraphWatcher(): void {
    if (this.rerenderSwGraph) {
      this.$store.commit("scenario/selectGraph", "sw");
      this.prepareDataForRunOffGraph().then(() => {
        this.renderSWGraphRunOff();
        this.renderSWGraphRain();
      });
    }

    this.rerenderSwGraph = false;
  }

  @Watch("swAnimationRunning")
  swAnimationRunningWatcher(): void {
    if (this.swAnimationRunning) {
      this.autoLoopAnimation();
    }
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
  <!--<div v-if="activeMenuComponent === 'AbmScenario'" id="timesheet" :class="{ ui_hide: !showUi || abmData == null }">-->
  <div
    id="timesheet"
    :class="{
      ui_hide: !showUi || (activeAbmSet == null && stormWater == false),
    }"
  >
    <!--
        <div class="graph_selection" v-if="activeAbmSet != null && stormWater != false">
            <v-btn>Show Pedestrians Results</v-btn>
            <v-btn>Show Storm Water Results</v-btn>
        </div>
        -->
    <!-- <h3><strong>Operating grade</strong> /over time</h3> -->
    <div
      class="time_panel panel"
      :class="{ show: mobileTimePanel, dismiss: selectGraph != 'abm' }"
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
    <div
      class="sw_panel panel"
      :class="{ show: mobileTimePanel, dismiss: selectGraph != 'sw' }"
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
    <div
      :class="{ dismiss: selectGraph != 'abm' }"
      class="button_section abm_buttons"
    >
      <!-- unused button with no function
            <div class="btn_wrapper">
                <v-btn @click="functionFollowsForm">
                    <v-icon>mdi-account-circle</v-icon>
                </v-btn>
            </div>
            -->

      <div
        class="btn_wrapper"
        v-bind:class="{ highlight: checkState }"
        v-if="checkState"
      >
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" @click="checkState = !checkState">
              <v-icon>mdi-chart-line</v-icon>
            </v-btn>
          </template>
          <span>Change Selection</span>
        </v-tooltip>
        <div class="filterMenu" v-bind:class="{ visible: checkState }">
          <div class="wrapper">
            <!-- <div class="hint">
                            <p>Select a dataset to compare</p>
                        </div> 
            -->
            <v-select
              :items="filterLabels"
              label="Select"
              hint="Choose dataset for comparison"
              persistent-hint
              dark
              v-model="filter"
              @change="activateComparisonGraph"
            ></v-select>
          </div>
        </div>
      </div>

      <div class="btn_wrapper">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="increaseAnimationSpeed">
              <v-icon v-bind="attrs" v-on="on">mdi-fast-forward</v-icon>
            </v-btn>
          </template>
          <span>Adjust Simulation Speed</span>
        </v-tooltip>
        <div class="indicators">
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 7 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 14 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 21 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 28 }"
          ></span>
        </div>
      </div>
      <div class="btn_wrapper">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" @click="triggerAnimation">
              <v-icon v-if="animationRunning">mdi-pause</v-icon>
              <v-icon v-else>mdi-play</v-icon>
            </v-btn>
          </template>
          <span v-if="animationRunning">Pause Animation</span>
          <span v-else>Play Animation</span>
        </v-tooltip>

        <div
          v-if="loop"
          class="looper"
          @click="setLoop"
          :class="{ highlight: loopSetter }"
        >
          <v-icon>mdi-backup-restore</v-icon>
        </div>
      </div>
      <div
        v-if="windowWidth <= 720"
        class="btn_wrapper"
        :class="{ highlight: mobileTimePanel }"
      >
        <v-btn @click="mobileTimePanel = !mobileTimePanel">
          <v-icon>mdi-timetable</v-icon>
        </v-btn>
      </div>
    </div>
    <div
      :class="{ dismiss: selectGraph != 'sw' }"
      class="button_section abm_buttons"
    >
      <!-- unused button with no function
            <div class="btn_wrapper">
                <v-btn @click="functionFollowsForm">
                    <v-icon>mdi-account-circle</v-icon>
                </v-btn>
            </div>
            -->
      <!-- i have no idea what this does -->
      <div class="btn_wrapper" v-bind:class="{ highlight: checkState }">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn v-bind="attrs" v-on="on" @click="checkState = !checkState">
              <v-icon>mdi-chart-line</v-icon>
            </v-btn>
          </template>
          <span>Compare by Transport Mode</span>
        </v-tooltip>
        <div class="filterMenu" v-bind:class="{ visible: checkState }">
          <div class="wrapper">
            <!--<div class="hint">
                            <p>Select a dataset to compare</p>
                        </div>-->
            <v-select
              :items="filterLabels"
              label="Select"
              hint="Choose dataset for comparison"
              persistent-hint
              dark
              v-model="filter"
              @change="activateComparisonGraph"
            ></v-select>
          </div>
        </div>
      </div>
      <div class="btn_wrapper">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn @click="increaseAnimationSpeed">
              <v-icon v-bind="attrs" v-on="on">mdi-fast-forward</v-icon>
            </v-btn>
          </template>
          <span>Adjust Simulation Speed</span>
        </v-tooltip>
        <div class="indicators">
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 7 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 14 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 21 }"
          ></span>
          <span
            class="indicator"
            v-bind:class="{ marked: animationSpeed >= 28 }"
          ></span>
        </div>
      </div>
      <div class="btn_wrapper">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              @click="swAnimationRunning = !swAnimationRunning"
            >
              <v-icon v-if="swAnimationRunning">mdi-pause</v-icon>
              <v-icon v-else>mdi-play</v-icon>
            </v-btn>
          </template>
          <span v-if="swAnimationRunning">Pause Animation</span>
          <span v-else>Play Animation</span>
        </v-tooltip>

        <div
          v-if="loop"
          class="looper"
          @click="setLoop"
          :class="{ highlight: loopSetter }"
        >
          <v-icon>mdi-backup-restore</v-icon>
        </div>
      </div>
      <div
        v-if="windowWidth <= 720"
        class="btn_wrapper"
        :class="{ highlight: mobileTimePanel }"
      >
        <v-btn @click="mobileTimePanel = !mobileTimePanel">
          <v-icon>mdi-timetable</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

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

  .button_section {
    display: flex;
    flex-flow: row wrap;
    align-content: flex-end;
    position: absolute;
    top: 12.5%;
    left: calc(100% + 5px);
    width: 30px;
    height: 70%;

    &.dismiss {
      display: none;
    }

    .btn_wrapper {
      position: relative;

      .looper {
        position: absolute;
        top: 0;
        right: -35px;
        width: 30px;
        height: 30px;
        border-radius: 3px;
        background: whitesmoke;
        @include drop_shadow;

        .v-icon {
          color: #222;
          width: 20px;
          height: 20px;
          margin: 5px;
        }

        &:hover {
          cursor: pointer;
        }

        &.highlight {
          background: $orange;
          filter: invert(1);
          border: 1px solid black;
        }
      }

      ::v-deep.v-btn {
        position: relative;
        padding: 0;
        width: 30px;
        height: 30px;
        min-width: 0;
        filter: invert(1);
        background: $bright1;
        margin: 0 0 4px;
        opacity: 0.8;
        @include drop_shadow;
      }

      &:nth-child(3) {
        ::v-deep.v-btn {
          opacity: 1;
          border: 1px solid $darkred;
        }
      }

      .indicators {
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        align-content: center;
        position: absolute;
        left: calc(100% + 2px);
        top: 0;
        width: 5px;
        height: 30px;
        opacity: 0;

        .indicator {
          flex: 1 0 100%;
          background: rgba(0, 0, 0, 0.85);

          &.marked {
            display: block;
            margin: 1px auto;
            width: 5px;
            height: 5px;
            background: $opaqueorange;
          }
        }
      }

      .filterMenu {
        opacity: 0;
        pointer-events: none;
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
          border: 1px solid $bright2;
          filter: invert(0) !important;
        }
      }

      &:hover {
        .indicators {
          opacity: 1;
          transition: 0.3s;
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

    .button_section {
      position: fixed;
      bottom: 0;
      left: 0;
      top: auto;
      width: 100%;
      height: 40px;
      background: black;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;

      .btn_wrapper {
        margin: 0 10px;

        &:nth-child(1) {
          order: 1;
        }

        &:nth-child(3) {
          order: 2;

          button {
            border-radius: 0px;
            border: 1px solid black;
            background: #e65449;
          }
        }

        &:nth-child(2) {
          order: 3;
        }

        &:last-child {
          order: 4;
          justify-self: flex-end;
          margin: 0 5px 0 auto;

          .v-btn {
            border-radius: 0px;
            border: none;
          }

          &.highlight {
            .v-btn {
              background: rgba(255, 255, 255, 0.85);
              border: 1px solid white;
            }
          }
        }
      }
    }
  }
}
</style>
