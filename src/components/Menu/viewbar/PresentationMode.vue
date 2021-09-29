<template>
  <div
    class="rogue_btn"
    v-if="!showUi"
    :class="{ toggled: presentationRunning }"
  >
    <v-btn @click="presentationMode">
      <v-tooltip right nudge-right="20">
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on">mdi-video</v-icon>
        </template>
        <span>Presentation Mode</span>
      </v-tooltip>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import type { MapboxMap, StoreStateWithModules } from "@/models";
import { Store } from "vuex";
@Component
export default class PresentationMode extends Vue {
  $store: Store<StoreStateWithModules>;
  presentationRunning = false;

  get map(): MapboxMap {
    return this.$store.state.map;
  }

  get showUi(): boolean {
    return this.$store.state.scenario.showUi;
  }

  async presentationMode(): Promise<void> {
    this.presentationRunning = !this.presentationRunning;

    if (this.presentationRunning) {
      await this.adjustPitch();
      this.rotateCamera(0);
    }
  }

  rotateCamera(timestamp: number): void {
    this.map.rotateTo((timestamp / 200) % 360, { duration: 0 });
    // Request the next frame of the animation.
    if (this.presentationRunning) {
      requestAnimationFrame(this.rotateCamera);
    }
  }

  async adjustPitch(): Promise<void> {
    const zoom = this.map.getZoom();
    const pitch = this.map.getPitch();

    if (zoom > 16 || zoom < 9) {
      this.map.setZoom(13);
    }

    if (pitch < 25) {
      this.map.setPitch(45);
    }

    /* 
    const bearing = this.map.getBearing();
    if(bearing < 35){
        this.map.setBearing(65);
    } 
    */
  }
}
</script>

<style lang="scss" scoped>
@import "@/style/colors.scss";
@import "@/style/mixins.scss";

.rogue_btn {
  position: fixed;
  top: calc(-50vh + 100px);
  left: 0px;

  .v-btn {
    border: 1px solid #888;
    background: transparent;
    border-radius: 0px;
    @include drop_shadow;

    .v-icon {
      color: whitesmoke;
    }
  }

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.75;
    background: $reversed;
    z-index: -1;
  }
}
</style>
