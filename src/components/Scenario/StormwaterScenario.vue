<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import Rain from "@/config/rain.json";
import { swLayerName } from "@/store/deck-layers";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import type { MenuLink } from "@/models";

export default {
  name: "StormwaterScenario",
  components: {
    MenuComponentDivision,
  },
  data() {
    return {
      activeDivision: null,
      showError: false,
      errMsg: "",
      resultOutdated: false,
      returnPeriod: 2,
      returnPeriodOptions: [
        {
          value: 2,
          label: "2yr Event",
        },
        {
          value: 10,
          label: "10yr Event",
        },
        {
          value: 100,
          label: "100yr Event",
        },
      ],
      flowPath: "blockToPark",
      flowPathOptions: [
        {
          value: "blockToPark",
          label: "Building > Block > Park",
        },
        {
          value: "blockToStreet",
          label: "Building > Block > Street",
        },
      ],
      greenRoofs: "extensive",
      greenRoofOptions: [
        {
          value: "extensive",
          label: "Extensive Green Roofs",
        },
        {
          value: "intensive",
          label: "Intensive Green Roofs",
        },
      ],
      /* feature not enabled yet
          improvedTreePits: true,
          treePitOptions: [
            {
              "value": true,
              "label": "Improved Tree Pits"
            },
            {
              "value": false,
              "label": "Other Trees"
            }
          ],
          */
      // bird's variables that i dont understand
      rainAmount: "2yr",
      rainTime: "test",
    };
  },
  computed: {
    ...mapState([
      "mapStyle",
      "view",
      "accessToken",
      "map",
      "layers",
      "layerIds",
    ]),
    ...generateStoreGetterSetter([
      ["resultLoading", "scenario/" + "resultLoading"], // todo manage stores
      ["savedStormWaterScenarios", "scenario/" + "savedStormWaterScenarios"], // todo manage stores
      ["stormWaterScenario", "scenario/" + "stormWaterScenario"], // todo manage stores
    ]),
    stormWater() {
      return this.$store.state.scenario.stormWater;
    },
    componentDivisions(): MenuLink[] {
      return [
        {
          title: "Scenario",
          icon: "mdi-map-marker-radius",
          hidden: false,
          default: true,
        },
        {
          title: "Dashboard",
          icon: "mdi-view-dashboard",
        },
        {
          title: "info",
          icon: "mdi-information-variant",
        },
      ];
    },
  },
  watch: {},
  beforeMount() {
    // todo remove this
    this.activateStormWater();
  },
  mounted: function () {
    // hide all other layers
    this.$store.dispatch("hideAllLayersButThese", ["stormwater"]);
  },
  methods: {
    activateStormWater() {
      this.$store.commit("scenario/stormWater", true);
      this.$store.commit("scenario/selectGraph", "sw");
    },
    async loadStormwaterMap() {
      this.resultLoading = true;
      this.$store.dispatch("removeSourceFromMap", swLayerName, { root: true });
      this.$store.commit("scenario/swResultGeoJson", null);
      this.$store
        .dispatch("scenario/updateStormWaterLayer", this.stormWaterScenario)
        .then(() => {
          // success
          this.$store.commit("scenario/stormWater", true);
          this.resultLoading = false;
          this.showError = false;
          this.resultOutdated = this.isResultOutdated();
        })
        .catch((err) => {
          console.log("caught error", err);
          this.$store.commit("scenario/stormWater", false);
          this.resultLoading = false;
          this.showError = true;
          this.errorMsg = err;
        });
    },
    changeRain(rain) {
      // TODO rain Amount sometimes is a string and sometimes array. gets used in different contexts. Refactor
      this.rainAmount = rain;
      this.$store.commit("scenario/rainAmount", Rain[rain]);
    },
    getRoofTypeString() {
      if (this.greenRoofs === "extensive") {
        return "GR-EX1";
      }
      return "GR-IN1";
    },
    runScenario() {
      // update stormwater scenario in store
      this.makeStormWaterScenario();

      // update selected rain gage (for TimeSheet only??)
      const returnPeriodString = this.returnPeriod.toString() + "yr";
      this.changeRain(returnPeriodString);

      // get stormwater result from cityPyo
      this.loadStormwaterMap();
    },
    makeStormWaterScenario() {
      this.stormWaterScenario = {
        return_period: this.returnPeriod,
        flow_path: this.flowPath,
        roofs: this.greenRoofs,
        // "treePits": this.treePits
      };
    },
    isResultOutdated() {
      console.warn("input changed");
      if (!this.stormWaterScenario) {
        this.resultOutdated = false;
      } else {
        this.resultOutdated =
          this.returnPeriod !== this.stormWaterScenario["return_period"] ||
          this.flowPath !== this.stormWaterScenario["flow_path"] ||
          this.greenRoofs !== this.stormWaterScenario["roofs"];
        // || this.treePits !== this.stormWaterScenario["treePits"]  // feature not enabled yet
      }
    },
  },
};
</script>

<template>
  <div id="scenario" ref="scenario">
    <MenuComponentDivision
      :menuLinks="componentDivisions"
      :highlighted="activeDivision"
      @active="activeDivision = $event"
    />

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <div
        v-if="activeDivision === 'Scenario'"
        class="component_content scenario"
      >
        <v-container fluid>
          <h2>Stormwater | Scenario Settings</h2>
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">TIMESERIES</header>
            <v-radio-group v-model="returnPeriod" @change="isResultOutdated()">
              <v-radio
                :value="returnPeriodOptions[0].value"
                flat
                :label="returnPeriodOptions[0].label"
                dark
              />
              <v-radio
                :value="returnPeriodOptions[1].value"
                flat
                :label="returnPeriodOptions[1].label"
                dark
              />
              <v-radio
                :value="returnPeriodOptions[2].value"
                flat
                :label="returnPeriodOptions[2].label"
                dark
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">FLOW PATH</header>
            <v-radio-group v-model="flowPath" @change="isResultOutdated()">
              <v-radio
                :value="flowPathOptions[0].value"
                flat
                :label="flowPathOptions[0].label"
                dark
              />
              <v-radio
                :value="flowPathOptions[1].value"
                flat
                :label="flowPathOptions[1].label"
                dark
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">ROOFS</header>
            <v-radio-group v-model="greenRoofs" @change="isResultOutdated()">
              <v-radio
                :value="greenRoofOptions[0].value"
                flat
                :label="greenRoofOptions[0].label"
                dark
              />
              <v-radio
                :value="greenRoofOptions[1].value"
                flat
                :label="greenRoofOptions[1].label"
                dark
              />
            </v-radio-group>
          </div>
          <!-- hidden for now
            <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
              <header class="text-sm-left">
                TREES
              </header>
              <v-radio-group v-model="improvedTreePits" @change="isResultOutdated()">
                <v-radio
                  :value="treePitOptions[0].value"
                  flat
                  :label="treePitOptions[0].label"
                  dark
                />
                <v-radio
                  :value="treePitOptions[1].value"
                  flat
                  :label="treePitOptions[1].label"
                  dark
                  />
              </v-radio-group>

            </div>   TREE PITS DIV -->
          <p v-if="showError" class="warning">{{ errorMsg }}</p>
          <v-btn
            @click="runScenario()"
            class="confirm_btn mt-2"
            :class="{ changesMade: resultOutdated }"
            :disabled="resultLoading"
          >
            Run Scenario
          </v-btn>
        </v-container>

        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear>...</v-progress-linear>
        </v-overlay>
      </div>
      <!--component content end -->
    </div>
    <!-- division end -->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="Dashboard" data-pic="mdi-view-dashboard">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Stormwater | Dashboard</h2>
        <p>To be developed</p>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="info" data-pic="mdi-information-variant">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'info'" class="component_content">
        <h2>Stormwater | About</h2>
        <br />
        <!-- Legend
        <Legend v-bind:topic="'stormwater'"></Legend>
        -->

        <!-- text block with subtext blocks, fade out to end to hint for scrolling -->
        <!-- legend color same as background! -->
        <div class="info_section">
          <h4>SWMM SIMULATION ENGINE</h4>
          <div class="info_text">
            The Stormwater Module uses EPA SWMM as the engine to simulate
            stormwater runoff. EPA SWMM is an open source software developed and
            maintained by the United States Environmental Protection Agency.
            Simulations are carried out using Version 5.1.015. SWMM can be
            downloaded from the US EPA website:
            https://www.epa.gov/water-research/storm-water-management-model-swmm.
          </div>
          <h4>LENGTH OF SIMULATION</h4>
          <div class="info_text">
            SWMM can be used for single event or long-term simulations. The
            Stormwater Module models only event storms. To model event storm
            precipitation, we use KOSTRA-DWD-2010R data for the Grasbrook site
            and apply Euler II for the rainfall distribution curve.
            <br />
          </div>
          <h4>RESULTS DISPLAYED - RUNOFF</h4>
          <div class="info_text">
            SWMM can output a varied of indicators and time series (see SWMM
            User Manual). In the current version of the Stormwater Module, we
            display only the results for stormwater runoff.
          </div>
          <h4>MODEL PARAMETERS</h4>
          <div class="info_text">
            Default values from the SWMM User’s Manual were used to set up the
            model. The surfaces type categories used in the model are adapted
            from the BIM buildings and spaces files. Validation of the model has
            not been performed, however, due to lack of data (e.g. long-term
            monitoring data of of a comparable watershed).
          </div>
        </div>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

.sw_button {
  display: block;
  width: 100%;
  margin: 10px auto;
  height: 40px;
  background: $reversed;
  color: whitesmoke;
  text-align: center;
  line-height: 40px;
}

.sw_dashboard {
  .storm_selection {
    .v-btn {
      opacity: 1;
      pointer-events: all;
      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }

  .load_vis {
    display: block;
    width: 100%;
    height: 40px;
    background: $reversed;
    color: whitesmoke;
    line-height: 40px;
    margin: 10px auto;
    @include drop_shadow;
  }
}
</style>