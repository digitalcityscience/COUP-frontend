<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import DashboardCharts from "@/components/Scenario/DashboardCharts.vue";
import FocusAreasLayer from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import amenitiesLayerConfig from "@/config/abmScenarioSupportLayers/amenitiesLayerConfig";
import {
  bridgesSource,
  hafenCityBridgeLayerConf,
  veddelUnderPassConfig,
} from "@/config/abmScenarioSupportLayers/bridgeLayersConfigs";
import { abmLayerIds } from "@/services/layers.service";
import MenuDivision from "@/components/Menu/MenuDivision.vue";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import {
  addDeckLayerToMap,
  hideAllLayersButThese,
  hideAllResultLayers,
  hideLayers,
  showLayers,
  removeSourceAndItsLayersFromMap,
  addSourceAndLayerToMap,
} from "@/services/map.service";
import ScenarioComponentNames from "@/config/scenarioComponentNames";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Store } from "vuex";

import type {
  MapboxMap,
  AbmScenarioConfiguration,
  MenuLink,
  StoreStateWithModules,
  AbmSimulationResult,
  AgentsClusteredForHeatmap,
  DataForAbmTimeGraph,
  AppContext,
  AbmMainStreetOptions,
  AbmBlocksOptions,
  AbmAmenityOptions,
  GeoJSON,
  AgentNameToIndexTable,
  AgentTrip,
  AbmScenarioConfigGrasbrook,
  AbmTimeRange,
} from "@/models";
import {
  buildAggregationLayer,
  buildTripsLayer,
} from "@/services/deck.service";
import * as resultProcessing from "@/services/abm/resultProcessing.service";

@Component({
  name: ScenarioComponentNames.pedestrian,
  components: { MenuComponentDivision, MenuDivision, DashboardCharts },
})
export default class AbmScenario extends Vue {
  $store: Store<StoreStateWithModules>;
  activeDivision = null;

  scenarioConfiguration: AbmScenarioConfiguration | null = null;

  mainStreetOrientationOptions: Record<
    AbmMainStreetOptions,
    AbmMainStreetOptions
  > = {
    horizontal: "horizontal",
    vertical: "vertical",
  };

  blockOptions: Record<AbmBlocksOptions, AbmBlocksOptions> = {
    open: "open",
    closed: "closed",
  };

  roofAmenitiesOptions: Record<AbmAmenityOptions, AbmAmenityOptions> = {
    random: "random",
    complementary: "complementary",
  };

  errorMsg = "";

  beforeDestroy(): void {
    // stop animation of abm layer
    this.$store.commit("abm/mutateAnimateLayer", false);
  }

  mounted(): void {
    this.scenarioConfiguration = { ...this.scenarioConfigurationGlobal };

    // if simulationResult is there,
    // but the result has not been processed sucessfully
    if (this.result && !this.isResultProcessed) {
      // build and add layers
      this.buildAndAddLayers();
      this.preProcessResultForStats();
    }

    // hide all other layers
    hideAllLayersButThese(this.map, [
      "abmTrips",
      "abmHeat",
      amenitiesLayerConfig.layerConfig.id,
      hafenCityBridgeLayerConf.id,
      veddelUnderPassConfig.id,
    ]);
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
        title: "Aggregation Layer",
        icon: "mdi-gauge",
      },
      {
        title: "info",
        icon: "mdi-information-variant",
      },
    ];
  }

  /**
   * GETTERS || SETTERS
   **/
  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get isPedestrianActiveComponent(): boolean {
    return (
      this.$store.state.activeMenuComponent ===
      ScenarioComponentNames.pedestrian
    );
  }

  // e.g. grasbrook or science city
  get appContext(): AppContext {
    return this.$store.state.appContext;
  }

  get result(): AbmSimulationResult {
    return this.$store.state.abm.simulationResult;
  }

  get amenitiesGeoJSON(): GeoJSON {
    return this.$store.state.abm.amenitiesGeoJSON;
  }

  get dataForHeatmap(): AgentsClusteredForHeatmap {
    return this.$store.state.abm.dataForHeatmap;
  }
  set dataForHeatmap(newData: AgentsClusteredForHeatmap) {
    this.$store.commit("abm/mutateDataForHeatmap", newData);
  }

  get scenarioConfigurationGlobal(): AbmScenarioConfiguration {
    return this.$store.getters["abm/scenarioConfiguration"];
  }
  set scenarioConfigurationGlobal(
    newScenarioConfiguration: AbmScenarioConfiguration
  ) {
    this.$store.commit(
      "abm/mutateScenarioConfiguration",
      newScenarioConfiguration
    );
  }

  get heatMapTimeRange(): AbmTimeRange {
    return this.$store.state.abm.timeRange;
  }
  set heatMapTimeRange(newTimeRange: AbmTimeRange) {
    this.$store.commit("abm/mutateTimeRange", newTimeRange);
  }

  get isResultLoading(): boolean {
    return this.$store.state.scenario.resultLoadingStati.pedestrian;
  }

  set isResultLoading(loadingState: boolean) {
    let loadingStati = Object.assign(
      {},
      this.$store.state.scenario.resultLoadingStati
    );

    loadingStati.pedestrian = loadingState;

    this.$store.commit("scenario/resultLoadingStati", loadingStati);
  }

  /** Do the selected settings fit the displayed result? */
  get isFormDirty(): boolean {
    return (
      this.result &&
      JSON.stringify(this.scenarioConfiguration) !==
        JSON.stringify(this.scenarioConfigurationGlobal)
    );
  }

  /**
   * processing results might fail if user switches component during fetchResult action
   * see: https://github.com/championswimmer/vuex-module-decorators/issues/408
   */
  get isResultProcessed(): boolean {
    return (
      !!this.$store.state.abm.dataForHeatmap ||
      !!this.$store.state.abm.dataForTimeGraph
    );
  }

  /** WATCHERS */
  @Watch("activeDivision")
  toggleFocusAreaLayer(): void {
    if (this.activeDivision === "Dashboard") {
      showLayers(this.map, [FocusAreasLayer.layerConfig.id]);
    } else {
      hideLayers(this.map, [FocusAreasLayer.layerConfig.id]);
    }
  }

  /** FUNCTIONS **/
  runScenario(): void {
    // update stormwater scenario in store
    this.scenarioConfigurationGlobal = Object.assign(
      {},
      this.scenarioConfiguration
    );

    // get abm result from cityPyo add add result layers to map
    this.fetchResultAndCreateNewResultLayers();
  }

  /**
   * fetch results and add them to map
   **/
  async fetchResultAndCreateNewResultLayers(): Promise<void> {
    // delete bridge layers, bc they are scenario specific
    removeSourceAndItsLayersFromMap(bridgesSource.id, this.map);
    this.$store.commit("abm/resetResult");

    this.isResultLoading = true;
    this.errorMsg = "";

    // fetch result and create new result layers
    this.$store
      .dispatch("abm/fetchResult")
      // sucessfully got result
      .then(() => {
        this.buildAndAddLayers();
        this.preProcessResultForStats();
      })
      .catch((err) => {
        console.log("caught error", err);
        this.errorMsg = err;
      })
      .finally(() => {
        // remove loader screen
        this.isResultLoading = false;
      });
  }

  /** Builds and adds all layers */
  buildAndAddLayers() {
    // add result layers
    this.buildTripsLayerAndAddToMap();
    this.buildHeatMapLayerAndAddToMap();

    // add bridge layers for grasbrook
    if (this.appContext === "grasbrook") {
      this.addBridgeLayers();
    }

    // add amenities layer
    amenitiesLayerConfig.source.options.data = this.amenitiesGeoJSON;
    addSourceAndLayerToMap(
      amenitiesLayerConfig.source,
      [amenitiesLayerConfig.layerConfig],
      this.map
    );
  }

  /**
   * create agent indexes and trip summary
   *  as input for stats calculation
   *  TODO: will be done in backend after Gama automization
   */
  preProcessResultForStats() {
    this.createAgentIndexes();
    this.createTripsSummary();
  }

  /**
   * builds the heatmap layer and adds it to the map
   **/
  buildHeatMapLayerAndAddToMap(): void {
    // process result for heatmap
    this.dataForHeatmap = resultProcessing.getAgentCountsPerHourAndCoordinate(
      this.result
    );
    this.updateAggregationLayer();
    if (!this.isPedestrianActiveComponent) {
      hideLayers(this.map, ["abmHeat"]);
    }
  }

  /** builds deck heatmap layer and adds it to map **/
  updateAggregationLayer() {
    buildAggregationLayer(this.dataForHeatmap, this.heatMapTimeRange).then(
      (layer) => {
        // todo check if still active component
        addDeckLayerToMap(layer, this.map);
      }
    );
  }

  /**
   * builds the trips layer and adds it to the map
   **/
  buildTripsLayerAndAddToMap(): void {
    buildTripsLayer(this.result)
      .then((tripsLayer) => {
        addDeckLayerToMap(tripsLayer, this.map);
        this.createTimeGraph();
      })
      .finally(() => {
        // hide layers if user switched to different component meanwhile
        if (!this.isPedestrianActiveComponent) {
          hideLayers(this.map, ["abmTrips", "abmAmenities"]);
        }
      });
  }

  /** adds the user selected bridges to the map **/
  async addBridgeLayers(): Promise<void> {
    let scenarioConfig = this
      .scenarioConfigurationGlobal as AbmScenarioConfigGrasbrook;

    let mapSource = bridgesSource;
    // Add bridge geojson to source description
    mapSource.options.data = await this.$store.state.cityPyO.getLayer(
      "bridges"
    );

    let layerConfigs = [];
    // add layer configs for bridges in selected scenario
    if (scenarioConfig.bridge_hafencity) {
      layerConfigs.push(hafenCityBridgeLayerConf);
    }
    if (scenarioConfig.underpass_veddel_north) {
      layerConfigs.push(veddelUnderPassConfig);
    }
    addSourceAndLayerToMap(bridgesSource, layerConfigs, this.map);
  }

  /**
   * processes the result data for visualization in timegraph
   * add timegraph
   * adds trips layer
   */
  async createTimeGraph() {
    // process result for timegraph
    const dataForTimeGraph =
      resultProcessing.aggregateAbmResultsBy5minForTimeGraph(this.result);
    this.$store.commit("abm/mutateDataForTimeGraph", dataForTimeGraph);
    this.$store.commit("abm/mutateTimeSheetNeedsRerender", true);
  }

  /** creates a lookup table agentName: agentIndex - which is needed for stats calc **/
  createAgentIndexes(): void {
    this.$store.commit(
      "abm/mutateAgentIndexesByName",
      resultProcessing.createAgentIndexesByName(this.result)
    );
  }

  /** creates a summary object of all agent trips (needed for stats calc.) **/
  createTripsSummary(): void {
    this.$store.commit(
      "abm/mutateTripsSummary",
      resultProcessing.createTripsSummary(this.result)
    );
  }

  /**
   * called upon slider change of heatMapTimeRange
   * recreates heatmap for given heatMapTimeRange
   **/
  changeHeatMapData(startTime, endTime): void {
    this.heatMapTimeRange = [startTime, endTime]; // save to store
    this.updateAggregationLayer();
  }
}
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
      v-if="appContext == 'grasbrook'"
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
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">BRIDGES</header>
            <v-switch
              :disabled="isResultLoading"
              v-model="scenarioConfiguration.bridge_hafencity"
              flat
              label="Bridge to HafenCity"
              dark
            />
            <v-switch
              :disabled="isResultLoading"
              v-model="scenarioConfiguration.underpass_veddel_north"
              flat
              label="Underpass to Veddel North"
              dark
            />
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">MAIN STREET ORIENTATION</header>
            <v-radio-group
              v-model="scenarioConfiguration.main_street_orientation"
            >
              <v-radio
                :value="mainStreetOrientationOptions.vertical"
                :disabled="isResultLoading"
                flat
                label="North-South Axes"
                dark
              />
              <v-radio
                :value="mainStreetOrientationOptions.horizontal"
                :disabled="isResultLoading"
                flat
                label="East-West Axes"
                dark
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">CITY BLOCK STRUCTURE</header>
            <v-radio-group v-model="scenarioConfiguration.blocks">
              <v-radio
                :value="blockOptions.open"
                :disabled="isResultLoading"
                flat
                label="Permeable"
                dark
              />
              <v-radio
                :value="blockOptions.closed"
                :disabled="isResultLoading"
                flat
                label="Private"
                dark
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">AMENITY DISTRIBUTION</header>
            <v-radio-group v-model="scenarioConfiguration.roof_amenities">
              <v-radio
                :value="roofAmenitiesOptions.complementary"
                :disabled="isResultLoading"
                flat
                label="Clustered by Type"
                dark
              />
              <v-radio
                :value="roofAmenitiesOptions.random"
                :disabled="isResultLoading"
                flat
                label="Mixed Distribution"
                dark
              />
            </v-radio-group>
          </div>
          <v-btn
            @click="runScenario"
            class="confirm_btn mt-2"
            :class="{ changesMade: isFormDirty }"
            :disabled="isResultLoading"
          >
            Run Scenario
          </v-btn>
        </v-container>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--SCENARIO DIVISION FOR ScienceCity Bahrendfeld ONLY-->
    <div
      v-if="appContext == 'schb'"
      class="division"
      data-title="Scenario"
      data-pic="mdi-map-marker-radius"
    >
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Scenario'" class="component_content">
        <h2>Pedestrian Flow | Scenario Settings</h2>
        <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
          <header class="text-sm-left">AMENITY DISTRIBUTION</header>
          <v-radio-group v-model="scenarioConfiguration.amenity_config">
            <v-radio
              value="current"
              :disabled="isResultLoading"
              flat
              label="STATUS QUO"
              dark
            />
            <v-radio
              value="future"
              :disabled="isResultLoading"
              flat
              label="SCIENCECITY"
              dark
            />
          </v-radio-group>
        </div>
        <v-btn
          @click="runScenario"
          class="confirm_btn mt-2"
          :class="{ changesMade: isFormDirty }"
          :disabled="isResultLoading"
        >
          Run Scenario
        </v-btn>
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
          v-model="heatMapTimeRange"
          :min="8"
          :max="24"
          hide-details
          dark
          class="align-center"
          @change="updateAggregationLayer()"
        >
          <template v-slot:prepend>
            <v-text-field
              :value="heatMapTimeRange[0]"
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
              :value="heatMapTimeRange[1]"
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
              <v-btn @click="changeHeatMapData(8, 23)" v-bind="attrs" v-on="on">
                <v-icon>mdi-av-timer</v-icon>
              </v-btn>
            </template>
            <span>All Day</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="changeHeatMapData(8, 10)" v-bind="attrs" v-on="on">
                <v-icon>mdi-weather-sunset-up</v-icon>
              </v-btn>
            </template>
            <span>Morning</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="changeHeatMapData(11, 15)"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-weather-sunny</v-icon>
              </v-btn>
            </template>
            <span>Mid-Day</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="changeHeatMapData(17, 20)"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-weather-sunset-down</v-icon>
              </v-btn>
            </template>
            <span>Evening</span>
          </v-tooltip>
        </div>
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
  }
}
</style>
