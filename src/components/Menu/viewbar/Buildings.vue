<template>
  <div>
    <BuildingsLegend v-if="legendVisible" />
    <div class="building-layers">
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
                    <v-icon v-bind="attrs" v-on="on" size="18">mdi-city</v-icon>
                  </span>
                </template>
                <span>Buildings</span>
              </v-tooltip>
            </v-btn>
          </span>
        </template>

        <div class="view_popup ml-4">
          <v-checkbox
            v-model="visibleBuildings.show"
            label="Show Buildings"
            @change="updateBuildingVisibility"
            dark
            hide-details
          ></v-checkbox>
          <v-checkbox
            v-model="visibleBuildings.amenities"
            label="Show Amenities"
            @change="updateBuildingVisibility"
            dark
            hide-details
            :disabled="activeAbmSet == null"
          ></v-checkbox>
          <v-btn class="legendbutton" @click="showBuildingUses">
            <v-icon>mdi-map-legend</v-icon>
            <template v-if="legendVisible">Hide Use Type Legend</template>
            <template v-else>Show Use Type Legend</template>
          </v-btn>
        </div>
      </v-menu>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit } from "vue-property-decorator";
import { MapboxMap, StoreStateWithModules } from "@/models";
import { Store } from "vuex";
import BuildingsLegend from "@/components/Menu/viewbar/BuildingsLegend.vue";

@Component({
  components: { BuildingsLegend },
})
export default class Buildings extends Vue {
  $store: Store<StoreStateWithModules>;
  menu = false;
  legendVisible = false;
  visibleBuildings = {
    show: true,
    highlight: false,
    amenities: true,
  };

  @Emit()
  legendToggled(): boolean {
    return this.legendVisible;
  }

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get activeAbmSet(): unknown {
    return this.$store.state.scenario.activeAbmSet;
  }

  get allFeaturesHighlighted(): boolean {
    return this.$store.state.allFeaturesHighlighted;
  }

  set allFeaturesHighlighted(newValue: boolean) {
    this.$store.commit("allFeaturesHighlighted", newValue);
  }

  get selectedMultiFeatures(): any[] {
    return this.$store.state.selectedMultiFeatures;
  }

  get layerIds(): string[] {
    return this.$store.state.layerIds;
  }

  showBuildingUses(): void {
    this.legendVisible = !this.legendVisible;
    this.legendToggled();
    this.colorizeBuildingsByUseType();
  }

  updateBuildingVisibility(): void {
    if (!this.visibleBuildings.show) {
      this.map.setLayoutProperty("groundfloor", "visibility", "none");
      this.map.setLayoutProperty("upperfloor", "visibility", "none");
      this.map.setLayoutProperty("rooftops", "visibility", "none");
    } else {
      this.map.setLayoutProperty("groundfloor", "visibility", "visible");
      this.map.setLayoutProperty("upperfloor", "visibility", "visible");
      this.map.setLayoutProperty("rooftops", "visibility", "visible");
    }

    if (!this.visibleBuildings.amenities) {
      this.map.setLayoutProperty("abmAmenities", "visibility", "none");
    } else {
      this.map.setLayoutProperty("abmAmenities", "visibility", "visible");
    }
  }

  colorizeBuildingsByUseType(): void {
    this.$store.commit("scenario/loader", true);

    if (this.allFeaturesHighlighted) {
      this.allFeaturesHighlighted = false;
      const featuresToRemove = this.selectedMultiFeatures;

      featuresToRemove.forEach((feature) => {
        feature.properties.selected = "inactive";
        this.$store.dispatch("editFeatureProps", feature);
      });
    } else {
      this.allFeaturesHighlighted = true;
      // this.openUseTypesLegend();

      const bbox = [
        [0, 0],
        [window.innerWidth, window.innerHeight],
      ];

      // console.log(this.layerIds);
      const features = this.map.queryRenderedFeatures(bbox as any, {
        layers: this.layerIds,
      });

      this.$store.commit("selectedMultiFeatures", features);
      const newFeature = this.selectedMultiFeatures;

      newFeature.forEach((feature) => {
        feature.properties.selected = "active";
        this.$store.dispatch("editFeatureProps", feature);
      });
    }

    this.$store.commit("scenario/loader", false);
  }
}
</script>

<style lang="scss" scoped>
@import "@/style/colors.scss";

.control {
  .v-btn {
    width: 40px;
    min-width: 0px;
    height: 30px;
    margin: 2px;
    background: rgba(255, 255, 255, 0.9);

    &.highlight {
      border: 1px solid $cyan;
    }
  }
}

// the element that folds out
//  if button in button bar is clicked
.view_popup {
  background: rgba(0, 0, 0, 0.8);
  width: 100%;
  font-size: 16px;
  letter-spacing: 0.0892857143em;
  text-indent: 0.0892857143em;
  white-space: nowrap;

  .v-input--checkbox {
    &:first-of-type {
      margin-top: 0;
    }

    margin: 5px 5px 5px 20px;

    ::v-deep.v-input__control {
      label {
        color: white;
        font-size: 90%;
        font-weight: 200;
      }
    }
  }

  .legendbutton {
    width: calc(100% - 20px);
    background: $reversed;
    color: whitesmoke;
    font-size: 85%;
    font-weight: 300;
    text-transform: none;
    border-radius: 0px;
    margin: 10px auto;

    .v-icon {
      margin-right: 5px;
    }
  }
}
</style>
