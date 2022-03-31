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
import DashboardCharts from "@/components/Scenario/DashboardCharts.vue";
import FocusAreasLayer from "@/config/urbanDesignLayers/focusAreasLayerConfig";
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
  mapHasLayer,
  addSourceAndLayerToMap,
} from "@/services/map.service";
import ScenarioComponentNames from "@/config/scenarioComponentNames";
import { Component, Vue, Watch } from "vue-property-decorator";
import { Store } from "vuex";
import { cityPyOUserid } from "@/services/authn.service";

import type {
  MapboxMap,
  AbmScenarioConfiguration,
  MenuLink, 
  StoreStateWithModules,
  AbmSimulationResult,
  AgentsClusteredForHeatmap,
  AgentsClusteredForTimeGraph
} from "@/models";
import { buildAggregationLayer, buildTripsLayer } from "@/services/deck.service";
import * as resultProcessing from "@/services/abm/resultProcessing.service";
import VueWorker from 'vue-worker'


@Component({
  name: ScenarioComponentNames.pedestrian,
  components: { MenuComponentDivision, MenuDivision },
})
export default class AbmScenario extends Vue {
  $store: Store<StoreStateWithModules>;
  $worker: VueWorker;
  activeDivision = null;
  errorMsg = "";

  scenarioConfiguration: AbmScenarioConfiguration | null = null;

  // TODO as props or not at all
  restrictedAccess: Boolean = false;
  designScenarioNames = bridges;
  moduleSettingOptions = moduleSettingNames;
  mainStreetOrientationOptions = mainStreetOrientationOptions;
  blockOptions = blockPermeabilityOptions;
  roofAmenitiesOptions = roofAmenitiesOptions;
  workshopScenarioNames = workshopScenarioNames;
  
  // TODO refactor: find a better way to deal with
  // context and restricted Acces
  // and resulting choices! Potentially have GUEST.vue
  context: String = "grasbrook";


  // move this shit to a processData service?
  age: 21;
  timePaths: [];
  weightData: [];
  weightObjData: [];
  timeRange: [0, 54000];
  heatMapTimeRan: [8, 23];

  beforeDestroy(): void {
    // stop animation of abm layer
    this.$store.commit("abm/mutateAnimateLayer", false);
  }

  mounted(): void {
    this.scenarioConfiguration = { ...this.scenarioConfigurationGlobal };
    // hide all other layers
    hideAllLayersButThese(this.map, ["abmTrips", "abmHeat", "abmAmenities"]); // TODO store names as variable in some config?
    
    // TODO better solution??
    this.$store.commit("scenario/selectGraph", "abm");
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

  get result(): AbmSimulationResult {
    return this.$store.state.abm.result;
  }

  // TODO formerly called moduleSettings here
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


  get heatMapTimeRange(): [number, number] {
    return this.$store.getters["scenario/abmTimeRange"];
  }
  set heatMapTimeRange(
    newTimeRange: [number, number]
  ) {
    this.$store.commit(
      "scenario/abmTimeRange",
      newTimeRange
    );
  }

  get resultLoading(): boolean {
    return this.$store.state.scenario.resultLoadingStati.pedestrian;
  }

  set resultLoading(loadingState: boolean) {
    let loadingStati = Object.assign(
      {},
      this.$store.state.scenario.resultLoadingStati
    );

    loadingStati.pedestrian = loadingState;

    this.$store.commit("scenario/resultLoadingStati", loadingStati);
  }


  get heatMap(): boolean {
    return this.$store.state.scenario.heatMap;
  } 


  get isFormDirty(): boolean {
    return (
      JSON.stringify(this.scenarioConfiguration) !==
      JSON.stringify(this.scenarioConfigurationGlobal)
    );
  }

  /** WATCHERS */
  @Watch("activeDivision")
  toggleFocusAreaLayer(): void {
    if (this.activeDivision === "Dashboard") {
      if (!mapHasLayer(this.map, FocusAreasLayer.layerConfig.id)) {
        addSourceAndLayerToMap(
          FocusAreasLayer.source,
          [FocusAreasLayer.layerConfig],
          this.map,
        )
      }
      showLayers(this.map, [FocusAreasLayer.layerConfig.id])
    }
    else {
      hideLayers(this.map, [FocusAreasLayer.layerConfig.id])
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
    this.removeAbmLayersFromMap();
    this.$store.commit("abm/resetResult");
    this.resultLoading = true;
    this.errorMsg = "";

    // fetch result and create new result layers
    this.$store
      .dispatch(
        "abm/fetchResult",
        cityPyOUserid(this.$store.state?.cityPyO) 
      )
      .then(() => {
        // sucessfully got result
        this.addTripsLayerAndTimeGraph();
        this.buildHeatMapLayerAndAddToMap();
      })
      .catch((err) => {
        console.log("caught error", err);
        this.errorMsg = err;
        
        // TODO refactor do we need this?? if so, why only heatmap?
        this.$store.commit("scenario/heatMap", false);
        this.$store.commit("scenario/heatMapVisible", false);
      })
      .finally(() => {
        // remove loader screen
         this.resultLoading = false; 
        }
      );
  }

   // deletes layers and sources of all abm Layers from amp
  removeAbmLayersFromMap(): void {
    ["abmTrips", "abmHeat", "abmAmenities"].forEach(layerName => {
      removeSourceAndItsLayersFromMap(layerName, this.map);
    })
  }

  /**
   * processes the result data for visualization in timegraph
   * add timegraph
   * adds trips layer
  */    
  addTripsLayerAndTimeGraph(): void {
    // process result for timegraph (in worker)
    this.$worker.run(resultProcessing.aggregateAbmResultsBy5minForTimeGraph, [this.result])
    .then((dataForTimeGraph: AgentsClusteredForTimeGraph) => {
      console.log("worker finished for timegraph")
      // show time graph and trips layer control
      this.$store.commit("abm/mutateDataForTimeGraph", dataForTimeGraph)
      this.$store.commit("abm/mutateReRenderTimeSheet", true);
      // add trips layer to map
      this.buildTripsLayerAndAddToMap();
    })
    .catch((err) => {
      console.warn("caught error when processing abm results for timegrap", err);
      this.resultLoading = false;
      this.errorMsg = err;
    })
  }

  /**
   * builds the trips layer and adds it to the map
  **/
  buildTripsLayerAndAddToMap(): void {
    buildTripsLayer(this.result, 0)
      .then((tripsLayer) => {
        addDeckLayerToMap(tripsLayer, this.map)
      })
      .finally(() => { 
        // hide layers if user switched to different component meanwhile
         if (!this.isPedestrianActiveComponent) {
            hideLayers(this.map, ["abmTrips", "abmAmenities"]);
        } else {
          // animate layer
          this.$store.commit("abm/mutateAnimateLayer", true);
        }
      })
  }

  /**
   * builds the heatmap layer and adds it to the map
   **/ 
  buildHeatMapLayerAndAddToMap(): void {
    // process result for heatmap (in worker)
    this.$worker.run(resultProcessing.getAgentCountsPerHourAndCoordinate, [this.result])
      .then((dataForHeatmap: AgentsClusteredForHeatmap) => {
        console.log("worker finished for heatmap")
        buildAggregationLayer(dataForHeatmap)
          .then((layer) => {
            // todo check if still active component
            addDeckLayerToMap(layer, this.map)
          })
      })
      .finally(() => { 
        // hide layers if user switched to different component meanwhile
         if (!this.isPedestrianActiveComponent) {
            hideLayers(this.map, ["abmHeat"]);
        }
      })
  }

  /**
   * called upon slider change of heatMapTimeRange
   * recreates heatmap for given heatMapTimeRange
  **/ 
  changeHeatMapData(startTime, endTime) {
    this.heatMapTimeRange = [startTime, endTime];
    // todo refactor move to abm store
    this.$store.dispatch("scenario/updateAggregationLayer");
  }
    
  // TODO refactor there is so much embedded logic in calling an ABM scenario for grasbrook. 
  // needs to be properly refactored
  loadScienceCityScenario(scenarioId) {
    this.resultLoading = true;
    this.$store
      .dispatch("scenario/loadScienceCityAbmScenario", scenarioId)
      .then(() => {
        this.resultLoading = false;
      });
  }
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
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">BRIDGES</header>
            <v-switch
              :disabled="resultLoading"
              v-model="scenarioConfiguration.bridge_hafencity"
              flat
              label="Bridge to HafenCity"
              dark
              :color="
                scenarioConfiguration.bridge_hafencity !=
                scenarioConfigurationGlobal.bridge_hafencity
                  ? '#fff'
                  : '#888'
              "
              :class="
                scenarioConfiguration.bridge_hafencity !=
                scenarioConfigurationGlobal.bridge_hafencity
                  ? 'switched'
                  : 'na'
              "
            />
            <v-switch
              :disabled="resultLoading"
              v-model="scenarioConfiguration.underpass_veddel_north"
              flat
              label="Underpass to Veddel North"
              dark
              :color="
                scenarioConfiguration.underpass_veddel_north !=
                scenarioConfigurationGlobal.underpass_veddel_north
                  ? '#fff'
                  : '#888'
              "
              :class="
                scenarioConfiguration.underpass_veddel_north !=
                scenarioConfigurationGlobal.underpass_veddel_north
                  ? 'switched'
                  : 'na'
              "
            />
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">MAIN STREET ORIENTATION</header>
            <v-radio-group
              v-model="scenarioConfiguration.main_street_orientation"
              :class="
                scenarioConfiguration.main_street_orientation !=
                scenarioConfigurationGlobal.main_street_orientation
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="mainStreetOrientationOptions.vertical"
                :disabled="resultLoading"
                flat
                label="North-South Axes"
                dark
                :color="
                  scenarioConfiguration.main_street_orientation !=
                  scenarioConfigurationGlobal.main_street_orientation
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="mainStreetOrientationOptions.horizontal"
                :disabled="resultLoading"
                flat
                label="East-West Axes"
                dark
                :color="
                  scenarioConfiguration.main_street_orientation !=
                  scenarioConfigurationGlobal.main_street_orientation
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">CITY BLOCK STRUCTURE</header>
            <v-radio-group
              v-model="scenarioConfiguration.blocks"
              :class="
                scenarioConfiguration.blocks != 
                scenarioConfigurationGlobal.blocks
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="blockOptions.open"
                :disabled="resultLoading"
                flat
                label="Permeable"
                dark
                :color="
                  scenarioConfiguration.blocks != 
                  scenarioConfigurationGlobal.blocks
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="blockOptions.closed"
                :disabled="resultLoading"
                flat
                label="Private"
                dark
                :color="
                  scenarioConfiguration.blocks != 
                  scenarioConfigurationGlobal.blocks
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <div class="scenario_box" :class="isFormDirty ? 'highlight' : ''">
            <header class="text-sm-left">AMENITY DISTRIBUTION</header>
            <v-radio-group
              v-model="scenarioConfiguration.roof_amenities"
              :class="
                scenarioConfiguration.roof_amenities != 
                scenarioConfigurationGlobal.roof_amenities
                  ? 'switched'
                  : 'na'
              "
            >
              <v-radio
                :value="roofAmenitiesOptions.complementary"
                :disabled="resultLoading"
                flat
                label="Clustered by Type"
                dark
                :color="
                  scenarioConfiguration.roof_amenities !=
                  scenarioConfigurationGlobal.roof_amenities
                    ? '#fff'
                    : '#888'
                "
              />
              <v-radio
                :value="roofAmenitiesOptions.random"
                :disabled="resultLoading"
                flat
                label="Mixed Distribution"
                dark
                :color="
                  scenarioConfiguration.roof_amenities !=
                  scenarioConfigurationGlobal.roof_amenities
                    ? '#fff'
                    : '#888'
                "
              />
            </v-radio-group>
          </div>
          <v-btn
            @click="runScenario"
            class="confirm_btn mt-2"
            :class="{ changesMade: isFormDirty }"
            :disabled="resultLoading"
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
          :disabled="resultLoading"
          >Status Quo</v-btn
        >
        <v-btn
          @click="loadScienceCityScenario('abm_scenario_schb')"
          class="scenario_main_btn"
          block
          :disabled="resultLoading"
          >ScienceCity</v-btn
        >
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
          :disabled="resultLoading"
          >Scenario I</v-btn
        >
        <v-btn
          @click="loadScenarioByName(workshopScenarioNames[1])"
          class="scenario_main_btn"
          block
          :disabled="resultLoading"
          >Scenario II</v-btn
        >
        <v-btn
          @click="loadScenarioByName(workshopScenarioNames[2])"
          class="scenario_main_btn"
          block
          :disabled="resultLoading"
          >Scenario III</v-btn
        >
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
          v-model="heatMapTimeRange
  "
          :min="8"
          :max="24"
          hide-details
          dark
          class="align-center"
          @change="changeHeatMapData()"
        >
          <template v-slot:prepend>
            <v-text-field
              :value="heatMapTimeRange
      [0]"
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
              :value="heatMapTimeRange
      [1]"
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
              <v-btn @click="changeHeatMapData(11, 15)" v-bind="attrs" v-on="on">
                <v-icon>mdi-weather-sunny</v-icon>
              </v-btn>
            </template>
            <span>Mid-Day</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn @click="changeHeatMapData(17, 20)" v-bind="attrs" v-on="on">
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
