<script>
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import { noiseSettingsNames } from "@/store/noise";
import hash from "object-hash";
import Legend from "@/components/Scenario/Legend";

export default {
  name: "WindScenario",
  components: {
    Legend: Legend,
  },
  props: {
    restrictedAccess: Boolean,
  },
  data() {
    return {
      activeDivision: null,
      componentDivisions: [],
      windSpeed: 5,
      windDirection: 270,
      resultOutdated: true,
      showError: false,
      scenarioAlreadySaved: false,
    };
  },
  computed: {
    //...mapState('scenario', ['resultLoading']), // getter only

    // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
    ...generateStoreGetterSetter([
      ["windScenarioHash", "scenario/" + "windScenarioHash"], // todo wind store
      ["resultLoading", "scenario/" + "resultLoading"], // todo manage stores
      ["savedWindScenarios", "scenario/" + "savedWindScenarios"], // todo manage stores
      ["currentScenario", "scenario/" + "currentWindScenario"], // todo manage stores
    ]),
  },
  watch: {
    windSpeed(newVal, old) {
      console.log("wind speed changed");
      console.log(newVal);
      this.resultOutdated = this.isResultOutdated();
      this.scenarioAlreadySaved = this.isScenarioAlreadySaved();
      console.log("is outdated?", this.isResultOutdated());
      console.log("saved scen", this.currentScenario);
    },
    windDirection(newVal, old) {
      console.log("wind direction changed");
      console.log(newVal);
      this.resultOutdated = this.isResultOutdated();
      this.scenarioAlreadySaved = this.isScenarioAlreadySaved();
    },
  },
  mounted: function () {
    // hide all other layers
    this.$store.dispatch("hideAllLayersButThese", ["wind"]);
    /*autogenerationg Sub Menu for all divs of Class "division"*/
    var divisions = document.getElementsByClassName("division");
    for (var i = 0; i < divisions.length; i++) {
      let divInstance = {
        title: divisions[i].getAttribute("data-title"),
        pic: divisions[i].getAttribute("data-pic"),
      };
      this.componentDivisions.push(divInstance);
    }

    this.activeDivision = divisions[0].getAttribute("data-title");
    console.log("active divisoin is", this.activeDivision);
  },
  methods: {
    isResultOutdated() {
      return (
        this.windSpeed !== this.currentScenario["wind_speed"] ||
        this.windDirection !== this.currentScenario["wind_direction"]
      );
    },
    // prop path is the path to the property inside the file that shall be updated. in this case the scenario description
    // for our scenario name "scenario_1"
    confirmWindScenario() {
      const fileName = "wind_scenario";
      const propPath = ["scenario_1"];
      this.currentScenario = {
        wind_speed: this.windSpeed,
        wind_direction: this.windDirection,
        result_format: "geojson",
        custom_roi: [],
      };
      this.windScenarioHash = hash(this.currentScenario); // todo use store variable
      this.currentScenario["hash"] = this.windScenarioHash;
      console.log(hash);
      console.log("saved scenari", this.currentScenario);

      this.getWindResults();
      // update scenario add cityPyo
      //this.$store.state.cityPyO.addLayerData(fileName, propPath, this.currentScenario).then(() => this.getWindResults())
    },
    async getWindResults() {
      this.resultLoading = true;
      this.$store.dispatch("removeSourceFromMap", "wind", { root: true });
      this.$store.commit("scenario/windResultGeoJson", null);
      this.$store
        .dispatch("scenario/updateWindLayer", this.currentScenario)
        .then(() => {
          // success
          this.$store.commit("scenario/windLayer", true);
          this.resultLoading = false;
          this.resultOutdated = this.isResultOutdated();
          this.scenarioAlreadySaved = this.isScenarioAlreadySaved();
        })
        .catch(() => {
          // fail
          this.$store.commit("scenario/windLayer", false);
          this.resultLoading = false;
          this.showError = true;
        });
    },
    loadSavedScenario(savedScenario) {
      this.windDirection = savedScenario["wind_direction"];
      this.windSpeed = savedScenario["wind_speed"];
      this.confirmWindScenario();
    },
    saveWindScenario() {
      console.log("saved scenarios", this.savedWindScenarios);
      if (!this.scenarioAlreadySaved) {
        // add current scenario to saved scenarios
        this.savedWindScenarios.push(this.currentScenario);
      }
      // update scenarioAlreadySaved variable
      this.scenarioAlreadySaved = this.isScenarioAlreadySaved();
      console.log(this.savedWindScenarios);
    },
    isScenarioAlreadySaved() {
      const isSaved =
        this.savedWindScenarios.filter((savedScen) => {
          return (
            JSON.stringify(savedScen) === JSON.stringify(this.currentScenario)
          );
        }).length > 0;

      console.log("is saved", isSaved);
      return isSaved;
    },
  },
};
</script>

<template>
  <div id="scenario" ref="scenario">
    <!-- google maps style legend at bottom -->
    <Legend :topic="'wind'" :showAtBottom="true"></Legend>

    <div class="component_divisions">
      <ul>
        <!-- This will create a menu item from each div of class "division" (scroll down for example) -->
        <li
          v-for="division in componentDivisions"
          :key="division.title"
          v-bind:class="{ highlight: activeDivision === division.title }"
        >
          <div class="component_link" @click="activeDivision = division.title">
            <v-icon>{{ division.pic }}</v-icon>
          </div>
          <div class="toHover">{{ division.title }}</div>
        </li>
      </ul>
    </div>

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div
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
          <h2>Wind Comfort | Scenario Settings</h2>
          <!-- Wind Direction -->
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">
              WIND DIRECTION
              {{ windDirection }}°
            </header>
            <v-slider
              v-model="windDirection"
              step="15"
              thumb-label="always"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="[
                'N',
                '',
                '',
                '',
                '',
                '',
                'E',
                '',
                '',
                '',
                '',
                '',
                'S',
                '',
                '',
                '',
                '',
                '',
                'W',
                '',
                '',
                '',
                '',
                '',
              ]"
              min="0"
              max="345"
              dark
              flat
            ></v-slider>
          </div>
          <div class="scenario_box" :class="resultOutdated ? 'highlight' : ''">
            <header class="text-sm-left">
              WIND SPEED
              {{ windSpeed }} km/h
            </header>
            <v-slider
              v-model="windSpeed"
              step="5"
              thumb-label="always"
              thumb-size="25"
              ticks="always"
              tick-size="4"
              :tick-labels="[
                '0',
                '',
                '',
                '',
                '20',
                '',
                '',
                '',
                '40',
                '',
                '',
                '',
                '60',
                '',
                '',
                '',
                '80',
              ]"
              min="0"
              max="80"
              dark
              flat
            ></v-slider>
          </div>
          <p v-if="showError" class="warning">
            Wind server not available at the moment
          </p>
          <v-btn
            @click="confirmWindScenario"
            class="confirm_btn"
            :class="{ changesMade: resultOutdated }"
            :disabled="resultLoading || showError"
          >
            RUN SCENARIO
          </v-btn>
          <v-btn
            style="
              margin-top: 1vh;
              margin-bottom: 1vh;
              float: right;
              max-width: 30px;
            "
            @click="saveWindScenario"
            class="confirm_btn"
            :disabled="resultOutdated || scenarioAlreadySaved"
            :dark="resultOutdated || scenarioAlreadySaved"
          >
            Save
          </v-btn>

          <!--saved scenarios -->
          <div class="saved_scenarios" style="margin-top: 5vh">
            <h4>RELOAD A SAVED SCENARIO</h4>
            <v-data-iterator
              :items="savedWindScenarios"
              :hide-default-footer="true"
            >
              <template v-slot:default="{ items }">
                {{/* Use the items to iterate */}}
                <v-flex v-for="(scenario, index) in items" :key="index">
                  <v-btn
                    v-if="index <= 2"
                    style="margin: 1vh auto"
                    @click="loadSavedScenario(scenario)"
                    outlined
                    dark
                    small
                  >
                    <span v-if="scenario.label">
                      {{ scenario.label }}
                    </span>
                    <span v-if="!scenario.label">
                      Direction: {{ scenario.wind_direction }} | Speed:
                      {{ scenario.wind_speed }}
                    </span>
                  </v-btn>
                </v-flex>
              </template>
            </v-data-iterator>
          </div>
        </v-container>
        <v-overlay :value="resultLoading">
          <div>Loading results</div>
          <v-progress-linear style="margin-top: 50px">...</v-progress-linear>
        </v-overlay>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->
    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="Dashboard" data-pic="mdi-view-dashboard">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Wind Comfort | Dashboard</h2>
        <p>To be developed</p>
      </div>
      <!--component_content end-->
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="info" data-pic="mdi-information-variant">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div
        v-if="activeDivision === 'info'"
        class="component_content"
        style="margin-top: 0"
      >
        <h2>Wind Comfort | About</h2>
        <Legend v-bind:topic="'wind'"></Legend>
        <div class="info_section">
          <h4>WHAT IS WIND COMFORT?</h4>
          <div class="info_text">
            Wind comfort is a categorization of wind speed at pedestrian level
            (1.75 meters above ground level) according to activities that can
            comfortably be performed. For example, low wind speed are preferable
            when sitting in a park bench. Higher wind speeds, on the other hand,
            are acceptable when going out for a run. The wind speed results are
            grouped into categories according to the Lawson Criteria for wind
            comfort. Understanding wind comfort is important for informing
            design decisions about urban morphology and open space design, and
            for determining appropriate uses of open space.
          </div>
          <h4>FAST CALCULATION TIMES—ML AND CFD</h4>
          <div class="info_text">
            The wind comfort calculation is a prediction of a computational
            fluid dynamic (CFD) simulation for the given wind speed and
            direction. The InFraRed model is trained using machine learning on
            3D CFD data. “Training” a simulation model makes it possible to run
            near real-time simulations using web-based applications. The
            accuracy of the model ranges between 80 and 95%. The InFraRed wind
            comfort model was developed by the City Intelligence Lab at the
            Austrian Institute of Technology.
          </div>
          <h4>WHY DO THE RESULTS APPEAR AS TILES?</h4>
          <div class="info_text">
            The results displayed in the Grasbrook CityScope are carried out in
            real-time. Despite significant time savings enabled by the
            ML-trained model, the calculation is still computationally intense.
            For this reason, the InFraRed server performs calculations in
            batches of up to 500x500m square tiles. Information about the
            building location and height is sent as geospatial data from the
            Grasbrook CityScope database, CityPyO, to the InFraRed API. The
            calculation results are then sent back and displayed on the
            Grasbrook CityScope frontend.
            <br />
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

.v-input {
  display: block;
}
</style>
