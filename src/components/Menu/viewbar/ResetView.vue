<template>
  <span class="reset_view">
    <v-btn @click="resetView">
      <v-tooltip right nudge-right="10">
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" size="18">mdi-crosshairs-gps</v-icon>
        </template>
        <span>Top View</span>
      </v-tooltip>
    </v-btn>
  </span>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import type { StoreState, MapboxMap } from "@/models";
import type { Store } from "vuex";
import defaultMapSettings from "@/defaultMapSettings";

@Component
export default class ResetView extends Vue {
  $store: Store<StoreState>;

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  resetView(): void {
    this.map.flyTo({
      center: defaultMapSettings.view.center,
      zoom: defaultMapSettings.view.zoom,
      bearing: defaultMapSettings.view.bearing,
      pitch: defaultMapSettings.view.pitch,
    });
  }
}
</script>

<style lang="scss" scoped>
@import "@/style/viewbar-button.scss";
.reset_view {
  .v-btn {
    @include viewbar-button;
  }
}
</style>
