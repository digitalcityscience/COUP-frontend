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
            <v-tooltip right>
              <template v-slot:activator="{ on, attrs }">
                <span>
                  <v-icon v-bind="attrs" v-on="on">mdi-layers</v-icon>
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
            v-model="visibleLayers.focusAreas"
            label="Focus Areas"
            color="white"
            dark
            hide-details
            :disabled="false"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>ABM Layers</h3>
          <v-checkbox
            v-model="visibleLayers.abm"
            label="ABM Animation"
            color="white"
            dark
            hide-details
            :disabled="activeAbmSet == null"
          ></v-checkbox>
          <v-checkbox
            v-model="visibleLayers.heat"
            label="ABM Aggregation"
            color="white"
            dark
            hide-details
            :disabled="!heatMap"
          ></v-checkbox>
          <v-checkbox
            v-model="visibleLayers.amenities"
            label="ABM Amenities"
            color="white"
            dark
            hide-details
            :disabled="activeAbmSet == null"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Noise Layers</h3>
          <v-checkbox
            v-model="visibleLayers.noise"
            label="Traffic Noise"
            color="white"
            dark
            hide-details
            :disabled="!noiseMap"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Climate Layers</h3>
          <v-checkbox
            v-model="visibleLayers.wind"
            label="Wind"
            color="white"
            dark
            hide-details
            :disabled="!wind"
          ></v-checkbox>
          <v-checkbox
            v-model="visibleLayers.sunExposure"
            label="Sun Exposure"
            color="white"
            dark
            hide-details
            :disabled="!sunExposure"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Stormwater Layers</h3>
          <v-checkbox
            v-model="visibleLayers.stormwater"
            label="Stormwater"
            color="white"
            dark
            hide-details
            :disabled="!stormWater"
          ></v-checkbox>
          <v-checkbox
            v-model="visibleLayers.trees"
            label="Trees"
            color="white"
            dark
            hide-details
            :disabled="!stormWater"
          ></v-checkbox>
        </div>
        <div class="layers">
          <h3>Multi Layer Analysis</h3>
          <v-checkbox
            v-model="visibleLayers.multiLayerAnalysis"
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
import { Component, Vue } from "vue-property-decorator";
import { VisibleLayers, StoreState } from "@/models";
@Component
export default class Layers extends Vue {
  menu = false;

  get heatMap(): unknown {
    return this.$store.state.scenario.heatMap;
  }

  get multiLayerAnalysis(): unknown {
    return this.$store.state.scenario.multiLayerAnalysisMap;
  }

  get activeAbmSet(): unknown {
    return this.$store.state.scenario.activeAbmSet;
  }

  get noiseMap(): unknown {
    return this.$store.state.scenario.noiseMap;
  }

  get stormWater(): unknown {
    return this.$store.state.scenario.stormWater;
  }

  get storeState(): StoreState {
    return this.$store.state;
  }

  get visibleLayers(): VisibleLayers {
    return this.storeState.visibleLayers;
  }

  set visibleLayers(newLayers: VisibleLayers) {
    this.$store.commit("visibleLayers", newLayers);
  }

  get wind(): unknown {
    return this.$store.state.scenario.windLayer;
  }

  get sunExposure(): unknown {
    return this.$store.state.scenario.sunExposureLayer;
  }
}
</script>

<style lang="scss" scoped>
@import "@/style.main.scss";
.control {
  .v-btn {
    width: 40px;
    min-width: 0px;
    height: 30px;
    margin: 2px;
    background: rgba(255, 255, 255, 0.9);

    .v-icon {
      font-size: 18px;
    }
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
