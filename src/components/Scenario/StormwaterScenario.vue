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
            <v-radio-group v-model="returnPeriod">
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
            <v-radio-group v-model="flowPath">
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
            <v-radio-group v-model="greenRoofs">
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
          <p v-if="errorMsg" class="warning">{{ errorMsg }}</p>
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

<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators";
import Rain from "@/config/rain.json";
import { swLayerName } from "@/store/deck-layers";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import type {
  StormWaterRoofType,
  MenuLink,
  StormWaterFlowPath,
  StormWaterScenarioState,
} from "@/models";

import { Component, Vue } from "vue-property-decorator";
import { StoreStateWithModules } from "@/models";
import { Store } from "vuex";

@Component({
  components: { MenuComponentDivision },
})
export default class StormwaterScenario extends Vue {
  $store: Store<StoreStateWithModules>;
  activeDivision = null;
  errorMsg: string = "";

  returnPeriod = 2;
  returnPeriodOptions = [
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
  ];
  flowPath: StormWaterFlowPath = "blockToPark";
  flowPathOptions = [
    {
      value: "blockToPark",
      label: "Building > Block > Park",
    },
    {
      value: "blockToStreet",
      label: "Building > Block > Street",
    },
  ];
  greenRoofs: StormWaterRoofType = "extensive";
  greenRoofOptions = [
    {
      value: "extensive",
      label: "Extensive Green Roofs",
    },
    {
      value: "intensive",
      label: "Intensive Green Roofs",
    },
  ];
  rainAmount: string = "2yr";

  beforeMount() {
    // todo remove this
    this.activateStormWater();
  }

  activateStormWater() {
    this.$store.commit("scenario/stormWater", true);
    this.$store.commit("scenario/selectGraph", "sw");
  }

  mounted() {
    // hide all other layers
    this.$store.dispatch("hideAllLayersButThese", ["stormwater"]);
  }

  get componentDivisions(): MenuLink[] {
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
  }

  get stormWater(): boolean {
    return this.$store.state.scenario.stormWater;
  }

  runScenario(): void {
    // update stormwater scenario in store
    this.makeStormWaterScenario();

    // update selected rain gage (for TimeSheet only??)
    const returnPeriodString: keyof typeof Rain =
      (this.returnPeriod.toString() + "yr") as keyof typeof Rain;
    this.changeRain(returnPeriodString);

    // get stormwater result from cityPyo
    this.loadStormwaterMap();
  }

  get stormWaterScenario(): StormWaterScenarioState {
    return this.$store.state.scenario.stormWaterScenario;
  }

  set stormWaterScenario(newScenario: StormWaterScenarioState) {
    this.$store.commit("scenario/stormWaterScenario", newScenario);
  }

  makeStormWaterScenario(): void {
    this.stormWaterScenario = {
      return_period: this.returnPeriod,
      flow_path: this.flowPath,
      roofs: this.greenRoofs,
    };
  }

  changeRain(returnPeriod: keyof typeof Rain): void {
    this.rainAmount = returnPeriod;
    this.$store.commit("scenario/rainAmount", Rain[returnPeriod]);
  }

  get resultLoading(): boolean {
    return this.$store.state.scenario.resultLoading;
  }

  set resultLoading(loadingState: boolean) {
    this.$store.commit("scenario/resultLoading", loadingState);
  }

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
        this.errorMsg = "";
      })
      .catch((err) => {
        console.log("caught error", err);
        this.$store.commit("scenario/stormWater", false);
        this.resultLoading = false;
        this.errorMsg = err;
      });
  }

  get resultOutdated(): boolean {
    console.warn("input changed");
    if (!this.stormWaterScenario) {
      return false;
    } else {
      return;
      this.returnPeriod !== this.stormWaterScenario["return_period"] ||
        this.flowPath !== this.stormWaterScenario["flow_path"] ||
        this.greenRoofs !== this.stormWaterScenario["roofs"];
    }
  }
}
</script>

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
