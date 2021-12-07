<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import {
  bridges,
  moduleSettingNames,
  mainStreetOrientationOptions,
  blockPermeabilityOptions,
  roofAmenitiesOptions,
  workshopScenarioNames,
} from "@/store/abm.ts";
import { ViewConfiguration } from "@/components/Scenario/ViewConfiguration";
import DashboardCharts from "@/components/Scenario/DashboardCharts.vue";
import FocusAreasLayer from "@/config/focusAreas.json";
import { getAbmLayerIds } from "@/config/layers";
import MenuDivision from "@/components/Menu/MenuDivision.vue";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import type { MenuLink } from "@/models";

export default {
  name: "AbmScenario",
  components: {
    DashboardCharts: DashboardCharts,
    MenuDivision,
    MenuComponentDivision,
  },
  props: {
    restrictedAccess: Boolean,
    context: String,
  },
  data() {
    return {
      activeDivision: null,
      designScenarioNames: bridges,
      moduleSettingOptions: moduleSettingNames,
      mainStreetOrientationOptions: mainStreetOrientationOptions,
      blockOptions: blockPermeabilityOptions,
      roofAmenitiesOptions: roofAmenitiesOptions,
      workshopScenarioNames: workshopScenarioNames,
      age: 21,
      timePaths: [],
      weightData: [],
      weightObjData: [],
      timeRange: [0, 54000],
      adjustRange: [8, 23],
      datamsg: "",
      pedestrianModel: true,
      btnlabel: "Generate Aggregation Layer",
      reloadHeatMapLayer: false,
    };
  },
  computed: {
    ...mapState(["map"]), // getter only
    ...mapState("scenario", ["resultLoading"]), // getter only
    ...mapState("scenario", ["moduleSettings"]), // getter only
    // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
    ...generateStoreGetterSetter([
      ["resultOutdated", "scenario/resultOutdated"],
      ["focusAreasShown", "focusAreasShown"],
      ["loader", "scenario/loader"],
      ["updateAbmStatsChart", "scenario/updateAbmStatsChart"],
      ["updateAmenityStatsChart", "scenario/updateAmenityStatsChart"],
      [
        "currentlyShownScenarioSettings",
        "scenario/currentlyShownScenarioSettings",
      ],
      [
        "bridge_hafencity",
        "scenario/moduleSettings/" + moduleSettingNames.bridge_hafencity,
      ],
      [
        "underpass_veddel_north",
        "scenario/moduleSettings/" + moduleSettingNames.underpass_veddel_north,
      ],
      [
        "main_street_orientation",
        "scenario/moduleSettings/" + moduleSettingNames.mainStreetOrientation,
      ],
      ["blocks", "scenario/moduleSettings/" + moduleSettingNames.blocks],
      [
        "roof_amenities",
        "scenario/moduleSettings/" + moduleSettingNames.roofAmenities,
      ],
    ]),
    abmStats() {
      return this.$store.state.scenario.abmStats;
    },
    amenityStats() {
      return this.$store.state.scenario.amenityStats;
    },
    heatMap() {
      return this.$store.state.scenario.heatMap;
    },
    showUi() {
      return this.$store.state.scenario.showUi;
    },
    viewConfig(): ViewConfiguration {
      return { filter: false };
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
          title: "Aggregation Layer",
          icon: "mdi-gauge",
        },
        {
          title: "info",
          icon: "mdi-information-variant",
          hidden: false,
        },
      ];
    },
  },
  watch: {
    resultsOutdated(newVal, oldVal) {
      console.log("changes made");
      console.log(newVal, oldVal);
    },
    heatMap() {
      if (this.heatMap) {
        this.btnlabel = "Hide Aggregation Layer";
      } else if (!this.heatMap) {
        this.btnlabel = "Show Aggregation Layer";
      }
    },
    activeDivision() {
      if (this.activeDivision === "Dashboard") {
        // load map layer with focus areas
        this.map.setLayoutProperty(
          FocusAreasLayer.mapSource.data.id,
          "visibility",
          "visible"
        );
        this.focusAreasShown = true;
      } else {
        if (this.map.getLayer(FocusAreasLayer.mapSource.data.id)) {
          // remove map layer with focus areas
          this.map.setLayoutProperty(
            FocusAreasLayer.mapSource.data.id,
            "visibility",
            "none"
          );
          this.focusAreasShown = false;
        }
      }
    },
  },
  mounted: function () {
    // hide all other layers
    this.$store.dispatch("hideAllLayersButThese", getAbmLayerIds());
    // switch time graph to ABM
    this.$store.commit("scenario/selectGraph", "abm");
    console.warn("context??", this.context);
  },
  methods: {
    confirmSettings() {
      // update currentlyShowScenarioSettigns
      this.currentlyShownScenarioSettings = JSON.parse(
        JSON.stringify(this.moduleSettings)
      );
      this.changesMade = false;
      this.resultOutdated = false;
      this.$store.commit("scenario/activeAbmSet", null);
      this.$store.dispatch("scenario/updateAbmDesignScenario");
    },
    changeHeatMapData() {
      if (this.adjustRange[0] > 8 || this.adjustRange[1] < 23) {
        this.$store.commit("scenario/loop", true);
      } else {
        this.$store.commit("scenario/loop", false);
      }

      this.$store.commit("scenario/abmTimeRange", this.adjustRange);
      this.$store.dispatch("scenario/updateLayers", "heatMap");
    },
    setHeatMapTimes(x, y) {
      this.adjustRange = [x, y];
      this.changeHeatMapData();
    },
    heatMapActive() {
      this.$store.commit("scenario/heatMap", !this.heatMap);
    },
    loadWorkshopScenario(scenarioId) {
      this.$store.dispatch("scenario/loadWorkshopScenario", scenarioId);
    },
    // TODO there is so much embedded logic in calling an ABM scenario for grasbrook. needs to be properly refactored
    loadScienceCityScenario(scenarioId) {
      this.$store.dispatch("scenario/loadScienceCityAbmScenario", scenarioId);
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
      v-if="!restrictedAccess && context == 'grasbrook'"
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div
        v-if="activeDivision === 'Scenario'"
        class="component_content scenario"
      >
        <v-container fluid>
          <h2>Pedestrian Flow | Scenario Settings</h2>
          <div
            class="scenario_box"
            :class="
              currentlyShownScenarioSettings.underpass_veddel_north !=
              underpass_veddel_north
                ? 'highlight'
                : 'na'
            "
          >
            <header class="text-sm-left">BRIDGES</header>
            <v-switch
              v-model="bridge_hafencity"
              flat
              label="Bridge to HafenCity"
              dark
              :color="
                currentlyShownScenarioSettings.bridge_hafencity !=
                bridge_hafencity
                  ? '#fff'
                  : '#888'
              "
              :class="
                currentlyShownScenarioSettings.bridge_hafencity !=
                bridge_hafencity
                  ? 'switched'
                  : 'na'
              "
            />
            <v-switch
              v-model="underpass_veddel_north"
              flat
              label="Underpass to Veddel North"
              dark
              :color="
                currentlyShownScenarioSettings.underpass_veddel_north !=
                underpass_veddel_north
                  ? '#fff'
                  : '#888'
              "
              :class="
                currentlyShownScenarioSettings.underpass_veddel_north !=
                underpass_veddel_north
                  ? 'switched'
                  : 'na'
              "
            />
          </div>
          <div
            class="scenario_box"
            :class="
              currentlyShownScenarioSettings.main_street_orientation !=
              main_street_orientation
                ? 'highlight'
                : 'na'
            "
          >
            <header class="text-sm-left">MAIN STREET ORIENTATION</header>
            <v-radio-group
              v-model="main_street_orientation"
              :class="
                currentlyShownScenarioSettings.main_street_orientation !=
                main_street_orientation
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="mainStreetOrientationOptions.vertical"
                flat
                label="North-South Axes"
                dark
                :color="
                  currentlyShownScenarioSettings.main_street_orientation !=
                  main_street_orientation
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="mainStreetOrientationOptions.horizontal"
                flat
                label="East-West Axes"
                dark
                :color="
                  currentlyShownScenarioSettings.main_street_orientation !=
                  main_street_orientation
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <div
            class="scenario_box"
            :class="
              currentlyShownScenarioSettings.blocks != blocks
                ? 'highlight'
                : 'na'
            "
          >
            <header class="text-sm-left">CITY BLOCK STRUCTURE</header>
            <v-radio-group
              v-model="blocks"
              :class="
                currentlyShownScenarioSettings.blocks != blocks
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="blockOptions.open"
                flat
                label="Permeable"
                dark
                :color="
                  currentlyShownScenarioSettings.blocks != blocks
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="blockOptions.closed"
                flat
                label="Private"
                dark
                :color="
                  currentlyShownScenarioSettings.blocks != blocks
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <div
            class="scenario_box"
            :class="
              currentlyShownScenarioSettings.roof_amenities != roof_amenities
                ? 'highlight'
                : 'na'
            "
          >
            <header class="text-sm-left">AMENITY DISTRIBUTION</header>
            <v-radio-group
              v-model="roof_amenities"
              :class="
                currentlyShownScenarioSettings.roof_amenities != roof_amenities
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="roofAmenitiesOptions.complementary"
                flat
                label="Clustered by Type"
                dark
                :color="
                  currentlyShownScenarioSettings.roof_amenities !=
                  roof_amenities
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="roofAmenitiesOptions.random"
                flat
                label="Mixed Distribution"
                dark
                :color="
                  currentlyShownScenarioSettings.roof_amenities !=
                  roof_amenities
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <v-btn
            @click="confirmSettings"
            class="confirm_btn mt-2"
            :class="{ changesMade: resultOutdated }"
          >
            Run Scenario
          </v-btn>

          <v-overlay :value="resultLoading">
            <div>Loading results</div>
            <v-progress-linear>...</v-progress-linear>
          </v-overlay>
        </v-container>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--SCENARIO DIVISION FOR ScienceCity Bahrendfeld ONLY-->
    <div
      v-if="context == 'schb'"
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Scenario'" class="component_content">
        <h2>Pedestrian Flow | Scenario Settings</h2>
        <v-btn
          @click="loadScienceCityScenario('abm_scenario_status_quo')"
          class="scenario_main_btn"
          block
          >Status Quo</v-btn
        >
        <v-btn
          @click="loadScienceCityScenario('abm_scenario_schb')"
          class="scenario_main_btn"
          block
          >ScienceCity</v-btn
        >
        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear>...</v-progress-linear>
        </v-overlay>
      </div>
    </div>
    <!--SCENARIO DIVISION FOR WORKSHOP ONLY-->
    <div
      v-if="restrictedAccess"
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Scenario'" class="component_content">
        <h2>Pedestrians Scenario Selection</h2>
        <v-btn
          @click="loadScenarioByName(workshopScenarioNames[0])"
          class="scenario_main_btn"
          block
          >Scenario I</v-btn
        >
        <v-btn
          @click="loadScenarioByName(workshopScenarioNames[1])"
          class="scenario_main_btn"
          block
          >Scenario II</v-btn
        >
        <v-btn
          @click="loadScenarioByName(workshopScenarioNames[2])"
          class="scenario_main_btn"
          block
          >Scenario III</v-btn
        >

        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear>...</v-progress-linear>
        </v-overlay>
      </div>
    </div>
    <!--division-end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="Dashboard" data-pic="mdi-view-dashboard">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Pedestrian Flow | Dashboard</h2>
        <DashboardCharts></DashboardCharts>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
    <div class="division" data-title="Aggregation Layer" data-pic="mdi-gauge">
      <div
        v-if="activeDivision === 'Aggregation Layer'"
        class="component_content"
      >
        <h2>Pedestrian Flow | Aggregation Layer</h2>
        <v-range-slider
          v-model="adjustRange"
          :min="8"
          :max="24"
          hide-details
          dark
          class="align-center"
          @change="changeHeatMapData()"
        >
          <template v-slot:prepend>
            <v-text-field
              :value="adjustRange[0]"
              class="mt-0 pt-0"
              hide-details
              single-line
              type="number"
              style="width: 30px"
              readonly
            ></v-text-field>
          </template>
          <template v-slot:append>
            <v-text-field
              :value="adjustRange[1]"
              class="mt-0 pt-0"
              hide-details
              single-line
              type="number"
              style="width: 30px"
              readonly
            ></v-text-field>
          </template>
        </v-range-slider>
        <div class="heatmap_buttons">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="setHeatMapTimes(8, 23)" v-bind="attrs" v-on="on">
                <v-icon>mdi-av-timer</v-icon>
              </v-btn>
            </template>
            <span>All Day</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="setHeatMapTimes(8, 10)" v-bind="attrs" v-on="on">
                <v-icon>mdi-weather-sunset-up</v-icon>
              </v-btn>
            </template>
            <span>Morning</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="setHeatMapTimes(11, 15)" v-bind="attrs" v-on="on">
                <v-icon>mdi-weather-sunny</v-icon>
              </v-btn>
            </template>
            <span>Mid-Day</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="setHeatMapTimes(17, 20)" v-bind="attrs" v-on="on">
                <v-icon>mdi-weather-sunset-down</v-icon>
              </v-btn>
            </template>
            <span>Evening</span>
          </v-tooltip>
        </div>
        <p>{{ datamsg }}</p>
        <!--<v-btn class="main_btn" @click="heatMapActive">{{ btnlabel }}</v-btn>-->
      </div>
    </div>

    <MenuDivision
      icon="mdi-information-variant"
      :active="activeDivision === 'info'"
      tooltip="info"
    >
      <h2>Pedestrian Flow | About</h2>
      <br />
      <div class="info_section">
        <h4>PEDESTRIANS - HUMAN AGENTS</h4>
        <div class="info_text">
          The model simulates the expected flow of people throughout the day as
          they move through the neighborhood footpath network. Human agents in
          the district, including residents, office workers / employees, and
          visitors (e.g. to the museum) are assigned basic daily routines.
          Within these routines, a certain degree of variability is modelled,
          depending on the availability (distance) of different amenities and
          assigned agent preferences. For example, a daily routine might look
          like: Home-Work-Lunch-Work-Leisure-Home. During the lunchtime part of
          the routine, an agent might be assigned to leave the office anytime
          between 11am and 3pm, and search for a place to eat given a preference
          ranking of (1) cafeteria, (2) restaurant, (3) cafe. Then, the agent
          would select whichever type is available within a certain walking
          distance and return to work afterwards.
        </div>

        <h4>AMENITIES</h4>
        <div class="info_text">
          Amenities, in particular ground floor uses relevant to the public
          (e.g. shops, restaurants, cafes) and keystone social and cultural
          amenities (e.g. museum, school), are explored as drivers of pedestrian
          activity.
        </div>

        <h4>VALIDATION</h4>
        <div class="info_text">
          To validate the approach, the model was applied to neighboring
          HafenCity for which some pedestrian counting data are available. The
          model showed a strong relative fit for the distribution of
          pedestrians. This indicates that the model assumptions can reasonably
          be used to compare future scenarios in the Hamburg context.
        </div>
        <h4>GAMA SIMULATION SOFTWARE</h4>
        <div class="info_text">
          Pedestrian flow simulations are performed using GAMA, a software for
          spatially explicit agent based modelling. GAMA is a free software
          published under a GNU Free Documentation License, Version 1.3 or
          later.
        </div>
      </div>
    </MenuDivision>
  </div>
</template>

<style lang="scss" scoped>
@import "../../style.main.scss";

#scenario {
  height: 100%;
  width: 100%;

  .scenario_box {
    position: relative;
    padding: 10px;
    box-sizing: border-box;
    margin: 3px auto;

    &:after {
      display: block;
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: $darkblue;
      opacity: 0.35;
      z-index: -1;
    }

    &.highlight {
      &:after {
        background: $darkred;
      }
    }

    &:hover {
      &:after {
        opacity: 0.5;
      }
    }
  }
  .scenario_main_btn {
    height: 200px;
    line-height: 200px;
    text-align: center;
    color: whitesmoke;
    margin: 10px auto;
    border-radius: 0px;
    background: rgba(0, 0, 0, 0.9);
    border: 1px solid #aaa;
    @include drop_shadow;
  }

  .v-input {
    ::v-deep.v-input__control {
      .v-input--radio-group__input {
        .v-radio {
          opacity: 0.35;

          &.v-item--active {
            opacity: 1;
          }
        }
      }
    }

    &.switched {
      ::v-deep.v-input__control {
        label {
          color: white;
        }
        .v-input--switch__thumb {
          background: white;
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
