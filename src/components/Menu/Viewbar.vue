<script lang="ts">
import FocusAreasLayerConfig from "@/config/focusAreas.json";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis.json";
import Layers from "@/components/Menu/viewbar/Layers.vue";
import LegendLine from "@/components/Menu/viewbar/LegendLine.vue";
import ResetView from "@/components/Menu/viewbar/ResetView.vue";
import ResetToNorth from "@/components/Menu/viewbar/ResetToNorth.vue";
import ToggleUi from "@/components/Menu/viewbar/ToggleUi.vue";
import Buildings from "@/components/Menu/viewbar/Buildings.vue";
import BuildingsLegend from "@/components/Menu/viewbar/BuildingsLegend.vue";
import PresentationMode from "@/components/Menu/viewbar/PresentationMode.vue";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { VisibleLayers, StoreState } from "@/models";

@Component({
  components: {
    Layers,
    ResetView,
    ToggleUi,
    PresentationMode,
    Buildings,
    LegendLine,
    BuildingsLegend,
    ResetToNorth,
  },
})
export default class Viewbar extends Vue {
  @Prop()
  restrictedAccess!: boolean;

  toggleFeatures = false;
  brightness = 1;
  legendVisible = false;

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

  get layerIds(): string[] {
    return this.$store.getters.layerIds;
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
    console.debug(this.layerIds);
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
    }

    if (this.layerIds.indexOf("abmAmenities") > -1) {
      if (this.visibleLayers.amenities) {
        this.map.setLayoutProperty("abmAmenities", "visibility", "visible");
        // this.$store.commit("scenario/heatMapVisible", true);
      } else {
        this.map.setLayoutProperty("abmAmenities", "visibility", "none");
      }
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
}
</script>

<template>
  <span>
    <div id="viewbar">
      <div class="button_bar">
        <LegendLine
          v-if="restrictedAccess && !legendVisible"
          label="Version Oct. 2020"
          color="#1380ab"
          icon="mdi-city"
        />
        <Buildings
          v-if="!restrictedAccess"
          @legend-toggled="legendVisible = $event"
        />
        <Layers />
        <ResetToNorth class="mt-5" />
        <ResetView />
        <ToggleUi />
      </div>
      <PresentationMode />
    </div>
    <BuildingsLegend v-if="legendVisible" class="buildings-legend" />
  </span>
</template>

<style scoped lang="scss">
@import "@/style.main.scss";

.buildings-legend {
  position: fixed;
  left: 10px;
  top: 10%;
  transform: translateY(-50%);
  width: auto;
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
  }
}
</style>
