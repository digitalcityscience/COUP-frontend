<script lang="ts">
import FocusAreasLayerConfig from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis/multiLayerAnalysisResultConfig";
import Layers from "@/components/Menu/viewbar/Layers.vue";
import LegendLine from "@/components/Menu/viewbar/LegendLine.vue";
import ResetView from "@/components/Menu/viewbar/ResetView.vue";
import ResetToNorth from "@/components/Menu/viewbar/ResetToNorth.vue";
import ToggleUi from "@/components/Menu/viewbar/ToggleUi.vue";
import Buildings from "@/components/Menu/viewbar/Buildings.vue";
import BuildingsLegend from "@/components/Menu/viewbar/BuildingsLegend.vue";
import PresentationMode from "@/components/Menu/viewbar/PresentationMode.vue";
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import {
  getVisibleLayerIds,
  hideLayers,
  showLayers,
} from "@/services/map.service";

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

  legendVisible = false;
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
