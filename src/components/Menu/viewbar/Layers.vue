<template>
  <div class="viewbar-layers">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-width="200"
      offset-x
      dark
    >
      <template v-slot:activator="{ on, attrs }">
        <span class="control">
          <v-btn v-bind="attrs" v-on="on" :class="{ highlight: menu }">
            <v-tooltip right nudge-right="10">
              <template v-slot:activator="{ on, attrs }">
                <span>
                  <v-icon v-bind="attrs" v-on="on" size="18">mdi-layers</v-icon>
                </span>
              </template>
              <span>Layers</span>
            </v-tooltip>
          </v-btn>
        </span>
      </template>

      <div class="view_popup ml-4">
        <div class="layers">
          <h3>Focus Areas</h3>
          <v-checkbox
            v-model="checkedLayers"
            value="focusAreas"
            label="Focus Areas"
            color="white"
            dark
            hide-details
            :disabled="false"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Pedestrians Layers</h3>
          <v-checkbox
            v-model="checkedLayers"
            value="abmTrips"
            label="Pedestrians Animation"
            color="white"
            dark
            hide-details
            :disabled="!hasAbmResult"
          ></v-checkbox>
          <v-checkbox
            v-model="checkedLayers"
            value="abmHeat"
            label="Pedestrians Aggregation"
            color="white"
            dark
            hide-details
            :disabled="!hasAbmResult"
          ></v-checkbox>
          <v-checkbox
            v-model="checkedLayers"
            value="abmAmenities"
            label="Pedestrians Amenities"
            color="white"
            dark
            hide-details
            :disabled="!hasAmenityGeoJSON"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Noise Layers</h3>
          <v-checkbox
            v-model="checkedLayers"
            value="noise"
            label="Traffic Noise"
            color="white"
            dark
            hide-details
            :disabled="!hasNoiseResult"
          ></v-checkbox>
          <v-checkbox
            v-model="checkedLayers"
            value="trafficCounts"
            label="Traffic Counts"
            color="white"
            dark
            hide-details
            :disabled="!hasNoiseResult"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Climate Layers</h3>
          <v-checkbox
            v-model="checkedLayers"
            label="Wind"
            value="wind"
            color="white"
            dark
            hide-details
            :disabled="!hasWindResult"
          ></v-checkbox>
          <v-checkbox
            v-model="checkedLayers"
            value="sun_exposure"
            label="Sun Exposure"
            color="white"
            dark
            hide-details
            :disabled="!hasSunExposureResult"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Stormwater Layers</h3>
          <v-checkbox
            v-model="checkedLayers"
            label="Stormwater"
            value="stormwater"
            color="white"
            dark
            hide-details
            :disabled="!hasStormwaterResult"
          ></v-checkbox>
          <!-- 
            TODO : get tree layer as from backend, when fetching stormwater result
          <v-checkbox
            v-model="checkedLayers"
            label="Trees"
            value="trees"
            color="white"
            dark
            hide-details
            :disabled="!hasStormwaterResult"
          ></v-checkbox>
          -->
        </div>
        <div class="layers">
          <h3>Multi Layer Analysis</h3>
          <v-checkbox
            v-model="checkedLayers"
            value="multiLayerAnalysis"
            label="Combined Layers"
            color="white"
            dark
            hide-details
            :disabled="!multiLayerAnalysis"
          ></v-checkbox>
        </div>
      </div>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Provide, Vue, Watch } from "vue-property-decorator";
import {
  getVisibleLayerIds,
  hideLayers,
  showLayers,
} from "@/services/map.service";
import { buildingLayerIds, landscapeLayerIds } from "@/services/layers.service";
import {
  hafenCityBridgeLayerConf,
  veddelUnderPassConfig,
} from "@/config/abmScenarioSupportLayers/bridgeLayersConfigs";

@Component
export default class Layers extends Vue {
  menu = false;
  checkedLayers = [];
  nonControllableLayers: string[] = [
    ...buildingLayerIds,
    ...landscapeLayerIds,
    hafenCityBridgeLayerConf.id,
    veddelUnderPassConfig.id,
  ];

  /** check which layers are visible when menu is toggled **/
  @Watch("menu")
  onMenuToggle(newVal, oldVal): void {
    if (newVal) {
      this.checkedLayers = getVisibleLayerIds(this.map);
    }
  }

  /** Update layer visibility on change of checkedLayers **/
  @Watch("checkedLayers", { deep: true })
  oncheckedLayers(): void {
    const currentlyVisibleLayers = getVisibleLayerIds(this.map);

    // layers visible, but no longer selected
    const layersToHide = currentlyVisibleLayers.filter((x) => {
      return (
        !this.checkedLayers.includes(x) &&
        !this.nonControllableLayers.includes(x)
      );
    });

    // layers selected, but not yet visible
    const layersToShow = this.checkedLayers.filter((x) => {
      return !currentlyVisibleLayers.includes(x);
    });

    // update map
    hideLayers(this.map, layersToHide);
    showLayers(this.map, layersToShow);
  }

  get map() {
    return this.$store.state.map;
  }

  get hasSunExposureResult(): boolean {
    return !!this.$store.state.scenario.sunExposureGeoJson;
  }

  get multiLayerAnalysis(): boolean {
    return !!this.$store.state.scenario.multiLayerAnalysisMap;
  }

  get hasAmenityGeoJSON(): boolean {
    return !!this.$store.state.abm.amenitiesGeoJSON;
  }

  get hasAbmResult(): boolean {
    return !!this.$store.state.abm.simulationResult;
  }

  get hasNoiseResult(): boolean {
    return !!this.$store.getters["noise/noiseResult"];
  }

  get hasStormwaterResult(): boolean {
    return !!this.$store.getters["stormwater/stormWaterResult"];
  }

  get hasWindResult(): boolean {
    return !!this.$store.getters["wind/windResult"];
  }
}
</script>

<style lang="scss" scoped>
@import "@/style/colors.scss";
@import "@/style/viewbar-button.scss";
.control {
  .v-btn {
    @include viewbar-button;

    &.highlight {
      border: 1px solid $cyan;
    }
  }
}

// the element that folds out
//  if button in button bar is clicked
.view_popup {
  background: rgba(0, 0, 0, 0.8);
  .layers {
    width: 100%;
    font-size: 16px;
    letter-spacing: 0.0892857143em;
    text-indent: 0.0892857143em;
    white-space: nowrap;

    h3 {
      width: 100%;
      background: #222;
      font-size: 0.875rem;
      padding: 3px;
      text-align: left;
      color: #aaa;

      font-weight: 500;
      text-transform: uppercase;
    }
  }

  // checkboxes
  .v-input--checkbox {
    margin: 5px 5px 5px 20px;

    ::v-deep.v-input__control {
      label {
        color: white;
        font-size: 90%;
        font-weight: 200;
      }
    }
  }
}
</style>
