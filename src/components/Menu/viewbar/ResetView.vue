<template>
  <v-btn class="reset_view mt-5" @click="resetView">
    <v-tooltip right nudge-right="10">
      <template v-slot:activator="{ on, attrs }">
        <v-icon v-bind="attrs" v-on="on" size="18">mdi-crosshairs-gps</v-icon>
      </template>
      <span>Top View</span>
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import type { StoreState, MapboxMap, View } from "@/models";
import type { Store } from "vuex";
@Component
export default class ResetView extends Vue {
  $store: Store<StoreState>;

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get view(): View {
    return this.$store.state.view;
  }

  resetView(): void {
    this.map.flyTo({
      center: this.view.center,
      zoom: this.view.zoom,
      bearing: this.view.bearing,
      pitch: this.view.pitch,
    });
  }
}
</script>

<style lang="scss" scoped></style>
