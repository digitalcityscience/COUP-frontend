<template>
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
          @change="toggleBuildingVisibility"
          dark
          hide-details
        ></v-checkbox>
        <v-checkbox
          v-model="visibleBuildings.amenities"
          label="Show Amenities"
          @change="toggleAmenitiesVisibility"
          dark
          hide-details
          :disabled="!hasAmenityGeoJSON"
        ></v-checkbox>
        <v-checkbox
          v-model="legendVisible"
          label="Show Use Type Legend"
          @change="showBuildingUses"
          dark
          hide-details
        ></v-checkbox>
      </div>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Emit } from "vue-property-decorator";
import {
  MapboxMap,
  SourceAndLayerConfigs,
  StoreStateWithModules,
} from "@/models";
import { Store } from "vuex";
import * as mapService from "@/services/map.service";
import {
  addDeckLayerToMap,
  hideLayers,
  showLayers,
  addSourceAndLayerToMap,
  mapHasLayer,
  toggleBuildingColors,
} from "@/services/map.service";

@Component
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

  get hasAmenityGeoJSON(): boolean {
    return !!this.$store.state.abm.amenitiesGeoJSON;
  }

  showBuildingUses(): void {
    this.legendToggled();
    toggleBuildingColors(this.map);
  }

  toggleBuildingVisibility(): void {
    if (this.visibleBuildings.show) {
      mapService.showBuildings(this.map);
    } else {
      mapService.hideBuildings(this.map);
    }
  }

  toggleAmenitiesVisibility(): void {
    if (this.visibleBuildings.amenities) {
      mapService.showAmenities(this.map);
    } else {
      mapService.hideAmenities(this.map);
    }
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
}
</style>
