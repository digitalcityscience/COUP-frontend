<template>
  <span class="reset_view">
    <v-btn @click="resetToNorth">
      <v-tooltip right nudge-right="10">
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" size="18">mdi-navigation</v-icon>
        </template>
        <span>Reset bearing to north</span>
      </v-tooltip>
    </v-btn>
  </span>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import type { StoreState, MapboxMap } from "@/models";
import type { Store } from "vuex";
@Component
export default class ResetToNorth extends Vue {
  $store: Store<StoreState>;

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  resetToNorth(): void {
    this.map.resetNorth();
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
