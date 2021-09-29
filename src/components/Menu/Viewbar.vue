<script lang="ts">
import FocusAreasLayerConfig from "@/config/focusAreas.json";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis.json";
import Layers from "@/components/Menu/viewbar/Layers.vue";
import ResetView from "@/components/Menu/viewbar/ResetView.vue";
import ToggleUi from "@/components/Menu/viewbar/ToggleUi.vue";
import Buildings from "@/components/Menu/viewbar/Buildings.vue";
import PresentationMode from "@/components/Menu/viewbar/PresentationMode.vue";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import legends from "@/config/legends.json";
import { VisibleLayers, StoreState } from "@/models";

export interface ViewbarVisibility {
  layers: boolean;
  legends: boolean;
  buildings: boolean;
  slider: boolean;
}

function defaultVisibility(): ViewbarVisibility {
  return {
    layers: false,
    legends: false,
    buildings: false,
    slider: false,
  };
}

@Component({
  components: { Layers, ResetView, ToggleUi, PresentationMode, Buildings },
})
export default class Viewbar extends Vue {
  @Prop()
  restrictedAccess!: boolean;

  toggleFeatures = false;
  brightness = 1;
  visibility: ViewbarVisibility = defaultVisibility();

  legendVisible = false;
  buildingUsesHeadline = legends.buildingUses.headline;

  @Watch("wind")
  onWind(newVal) {
    this.visibleLayers.wind = newVal;
  }

  @Watch("focusAreasShown")
  onFocusAreasShown(newVal) {
    this.visibleLayers.focusAreas = newVal;
  }

  @Watch("visibleLayers", { deep: true })
  onVisibleLayers(): void {
    console.warn("visible layers watched");
    this.updateLayerVisibility();
  }

  get storeState(): StoreState {
    return this.$store.state;
  }

  get mapStyle() {
    return this.storeState.mapStyle;
  }

  get accessToken() {
    return this.$store.state.accessToken;
  }

  get map() {
    return this.$store.state.map;
  }

  get activeMenuComponent() {
    return this.$store.state.activeMenuComponent;
  }

  get layers() {
    return this.$store.state.layers;
  }

  get visibleLayers(): VisibleLayers {
    return this.storeState.visibleLayers;
  }

  set visibleLayers(newLayers: VisibleLayers) {
    this.$store.commit("visibleLayers", newLayers);
  }

  get focusAreasShown(): boolean {
    return this.storeState.focusAreasShown;
  }

  set focusAreasShown(newValue: boolean) {
    this.$store.commit("focusAreasShown", newValue);
  }

  get layerIds() {
    return this.storeState.layerIds;
  }

  get wind() {
    return this.$store.state.scenario.windLayer;
  }

  /** TODO completely unused ??
        openUseTypesLegend(){
          this.showLegend = true
          this.$modal.show(
            UseTypesLegend,
            {},
            {draggable: true, width:200, adaptive: true, clickToClose: true,  shiftX: 0.025, shiftY: 0.1}
          )
        }, */

  // todo this really needs to be refactored to use a central function which takes layers as arguments
  updateLayerVisibility() {
    console.log(this.layerIds);
    if (this.layerIds.indexOf("abmTrips") > -1) {
      if (this.visibleLayers.abm) {
        this.map.setLayoutProperty("abmTrips", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("abmTrips", "visibility", "none");
      }
    }

    if (this.layerIds.indexOf("abmHeat") > -1) {
      if (this.visibleLayers.heat) {
        this.map.setLayoutProperty("abmHeat", "visibility", "visible");
        // this.$store.commit("scenario/heatMapVisible", true);
      } else {
        this.map.setLayoutProperty("abmHeat", "visibility", "none");
        // this.$store.commit("scenario/heatMapVisible", false);
      }

      // this.$store.dispatch('scenario/rebuildTripsLayer', this.filterSettings);
    }

    if (this.layerIds.indexOf("abmAmenities") > -1) {
      if (this.visibleLayers.amenities) {
        this.map.setLayoutProperty("abmAmenities", "visibility", "visible");
        // this.$store.commit("scenario/heatMapVisible", true);
      } else {
        this.map.setLayoutProperty("abmAmenities", "visibility", "none");
        // this.$store.commit("scenario/heatMapVisible", false);
      }

      // this.$store.dispatch('scenario/rebuildTripsLayer', this.filterSettings);
    }

    if (this.layerIds.indexOf("noise") > -1) {
      if (this.visibleLayers.noise) {
        this.map.setLayoutProperty("noise", "visibility", "visible");
        this.map.setLayoutProperty("trafficCounts", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("noise", "visibility", "none");
        this.map.setLayoutProperty("trafficCounts", "visibility", "none");
      }
    }

    if (this.layerIds.indexOf("wind") > -1) {
      if (this.visibleLayers.wind) {
        this.map.setLayoutProperty("wind", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("wind", "visibility", "none");
      }
    }
    if (this.layerIds.indexOf("sun_exposure") > -1) {
      if (this.visibleLayers.sunExposure) {
        this.map.setLayoutProperty("sun_exposure", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("sun_exposure", "visibility", "none");
      }
    }
    if (this.layerIds.indexOf("stormwater") > -1) {
      if (this.visibleLayers.stormwater) {
        this.map.setLayoutProperty("stormwater", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("stormwater", "visibility", "none");
      }
    }
    if (this.layerIds.indexOf("trees") > -1) {
      if (this.visibleLayers.trees) {
        this.map.setLayoutProperty("trees", "visibility", "visible");
      } else {
        this.map.setLayoutProperty("trees", "visibility", "none");
      }
    }
    if (this.layerIds.indexOf("focusAreas") > -1) {
      console.log("visible layers", this.visibleLayers);
      if (this.visibleLayers.focusAreas) {
        this.map.setLayoutProperty(
          FocusAreasLayerConfig.mapSource.data.id,
          "visibility",
          "visible"
        );
      } else {
        this.map.setLayoutProperty(
          FocusAreasLayerConfig.mapSource.data.id,
          "visibility",
          "none"
        );
      }
    }
    if (this.layerIds.indexOf("multiLayerAnalysis") > -1) {
      console.log("visible layers", this.visibleLayers);
      if (this.visibleLayers.multiLayerAnalysis) {
        this.map.setLayoutProperty(
          MultiLayerAnalysisConfig.layer.id,
          "visibility",
          "visible"
        );
      } else {
        this.map.setLayoutProperty(
          MultiLayerAnalysisConfig.layer.id,
          "visibility",
          "none"
        );
      }
    }
  }

  onClickOutside(): void {
    this.visibility = defaultVisibility();
  }
}
</script>

<template>
  <div id="viewbar" v-click-outside="onClickOutside">
    <div class="button_bar">
      <!-- show BIM version -->
      <v-btn v-if="restrictedAccess && !legendVisible" class="legend"
        ><v-icon style="color: #1380ab">mdi-city</v-icon>
        <div class="infobox"><p>Version Oct. 2020</p></div></v-btn
      >
      <Buildings
        v-if="!restrictedAccess"
        @legend-toggled="legendVisible = $event"
      />
      <Layers />
      <ResetView />
      <ToggleUi />
    </div>
    <PresentationMode />
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

.v-tooltip__content--fixed {
  margin-left: 10px;
}

#viewbar {
  position: fixed;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: auto;
  background: transparent;

  .button_bar {
    display: flex;
    flex-flow: column wrap;
    width: 40px;

    .legend {
      display: block;
      position: relative;
      width: 150px;
      //min-height:200px;
      background: rgba(0, 0, 0, 0.9);
      max-width: 100%;
      padding: 5px;
      box-sizing: border-box;
      @include drop_shadow;
    }

    .v-btn {
      width: 40px;
      min-width: 0px;
      height: 30px;
      margin: 2px;
      background: rgba(255, 255, 255, 0.9);
      @include drop_shadow;

      &.legend {
        pointer-events: none;
        background: rgba(0, 0, 0, 0.9);

        /*&.yellow {
                        .v-icon {
                            color:#FFB121;
                        }
                    }
                    &.red {
                        .v-icon {
                            color:#F76A6A;
                        }
                    }
                    &.blue {
                        .v-icon {
                            color:#4EBFFC;
                        }
                    }*/

        .infobox {
          width: 115px;
          height: 28px;
          position: absolute;
          top: -1;
          left: 40px;
          background: rgba(0, 0, 0, 0.75);
          @include drop_shadow;
          p {
            text-transform: none;
            color: whitesmoke;
            line-height: 28px;
            font-size: 90%;
            font-weight: 300;
          }
        }
      }

      .v-icon {
        font-size: 18px;
      }

      // the element that folds out
      //  if button in button bar is clicked
      .view_popup {
        position: absolute;
        left: 45px;
        top: 50%;
        transform: translateY(-25%);
        width: 200px;
        background: rgba(0, 0, 0, 0.8);
        @include drop_shadow;

        // checkboxes
        .v-input--checkbox {
          margin: 5px 5px 5px 20px;

          ::v-deep.v-input__control {
            label {
              text-transform: none;
              color: white;
              font-size: 90%;
              font-weight: 200;
            }
          }
        }

        .v-radio {
          margin: 5px 5px 5px 20px;
        }

        // radio buttons
        .v-input--selection-controls {
          color: rgba(211, 211, 211, 0.5); // lightgrey, 50%

          ::v-deep.v-input__control {
            label {
              text-transform: none;
              color: white;
              font-size: 90%;
              font-weight: 200;
            }
          }
        }
      }

      .popup_cnt {
        position: absolute;
        left: 34px;
        top: 0;
        width: 200px;
        background: rgba(0, 0, 0, 0.8);
        @include drop_shadow;

        p {
          color: #aaa;
          text-transform: none;
          font-size: 80%;
          text-align: right;
          padding: 0px 10px;
          margin: 10px auto 5px auto;
        }

        .v-input {
          position: relative;
          width: 90%;
          margin: auto;

          ::v-deep.v-input__append-outer {
            position: absolute;
            top: 15px;
            left: 50%;
            margin: 0;
            transform: translateX(-50%);
            pointer-events: none;

            .v-input {
              width: 40px;
              .v-input__control {
                .v-input__slot {
                  margin: 0 !important;

                  .v-text-field__slot {
                    font-size: 80% !important;
                    input {
                      text-align: center;
                    }
                  }
                  &:before,
                  &:after {
                    display: none !important;
                  }
                }
              }
            }
          }
        }
      }

      &.highlight {
        border: 1px solid $orange;
      }
    }
  }
}
</style>
