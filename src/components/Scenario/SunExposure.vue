<script lang="ts">
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators.ts";
import { noiseSettingsNames } from "@/store/noise";
import hash from "object-hash";
import Legend from "@/components/Scenario/Legend.vue";
import MenuComponentDivision from "@/components/Menu/MenuComponentDivision.vue";
import type { MenuLink } from "@/models";

export default {
  name: "SunExposureResults",
  components: {
    Legend,
    MenuComponentDivision,
  },
  data() {
    return {
      activeDivision: null,
      showError: false,
      sunExposureLoaded: false,
    };
  },
  computed: {
    ...mapState("scenario", ["resultLoading"]), // getter only

    // syntax for storeGetterSetter [variableName, get path, ? optional custom commit path]
    /*...generateStoreGetterSetter([
        ['resultLoading', 'scenario/' + 'resultLoading'],  // todo manage stores
      ])*/
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
          hidden: false,
        },
        {
          title: "info",
          icon: "mdi-information-variant",
          hidden: false,
        },
      ];
    },
  },
  watch: {},
  mounted: function () {
    // hide all other layers
    this.$store.dispatch("hideAllLayersButThese", ["sun_exposure"]);
  },
  methods: {
    async loadResult() {
      this.$store.dispatch("scenario/addSunExposureLayer").then(() => {
        this.$store.commit("scenario/sunExposureLayer", true);
        this.sunExposureLoaded = true;
      });
    },
  },
};
</script>

<template>
  <div id="scenario" ref="scenario">
    <!-- google maps style legend at bottom -->
    <Legend :topic="'sunExposure'" :showAtBottom="true"></Legend>
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
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div
        v-if="activeDivision === 'Scenario'"
        class="component_content scenario"
      >
        <v-container fluid>
          <!--- SUN EXPOSURE -->
          <h2>Sun Exposure | Scenario Settings</h2>

          <div
            class="scenario_box"
            :class="!sunExposureLoaded ? 'highlight' : ''"
          >
            <header class="text-sm-left">
              h/day <br />
              Hours of sunlight per day averaged over a year
            </header>
          </div>
          <v-btn @click="loadResult()" class="confirm_btn mt-2">
            Run Scenario
          </v-btn>
        </v-container>
      </div>
      <!--component_content end-->
      <v-overlay :value="resultLoading">
        <div>Loading results</div>
        <v-progress-linear style="margin-top: 50px">...</v-progress-linear>
      </v-overlay>
    </div>
    <!--division end-->

    <!--each div element needs data-title and data-pic for autocreating menu buttons-->
    <!--icon code is selected for material icons ... look up https://materialdesignicons.com/cdn/2.0.46/ for possible icons-->
    <div class="division" data-title="Dashboard" data-pic="mdi-view-dashboard">
      <!--v-if needs to be set to data-title to make switch between divisions possible-->
      <div v-if="activeDivision === 'Dashboard'" class="component_content">
        <h2>Sun Exposure | Dashboard</h2>
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
        <h2>Sun Exposure | About</h2>
        <div class="info_section">
          <Legend :topic="'sunExposure'" :showAtBottom="false"></Legend>
          <h4>INFRARED SUNLIGHT HOURS SIMULATION</h4>
          <div class="info_text">
            The sunlight hours simulation is a yearly average. The InFraRed
            model is trained using machine learning on data for the region of
            Vienna, Austria. “Training” a simulation model makes it possible to
            run near real-time simulations using web-based applications.
            However, because the model is trained on the conditions in Vienna,
            the result maps for Hamburg are inaccurate. We have included them
            here for demonstration purposes.
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
</style>
