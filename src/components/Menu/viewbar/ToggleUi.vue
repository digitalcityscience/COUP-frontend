<template>
  <v-btn class="toggle_ui" @click="toggleUi">
    <v-tooltip right nudge-right="10">
      <template v-slot:activator="{ on, attrs }">
        <v-icon v-if="showUi" v-bind="attrs" v-on="on" size="18">
          mdi-eye-off
        </v-icon>
        <v-icon v-else v-bind="attrs" v-on="on" size="18">mdi-eye</v-icon>
      </template>
      <span>Toggle UI</span>
    </v-tooltip>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
@Component
export default class ToggleUi extends Vue {
  showUi = true;

  toggleUi(): void {
    this.showUi = !this.showUi;
    this.$store.commit("scenario/showUi", this.showUi);
  }
}
</script>

<style lang="scss" scoped></style>
