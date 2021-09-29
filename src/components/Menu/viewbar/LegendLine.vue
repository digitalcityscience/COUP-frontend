<template>
  <div class="legend-line">
    <v-btn class="legend">
      <v-icon :color="color" size="18">{{ icon }}</v-icon>
      <div class="infobox">
        <p>{{ label }}</p>
      </div>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
@Component
export default class LegendLine extends Vue {
  @Prop()
  label!: string;
  @Prop()
  icon!: string;
  @Prop()
  color!: string;
}
</script>

<style lang="scss" scoped>
@import "@/style/mixins.scss";

.legend-line {
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

      .infobox {
        width: 120px;
        text-align: left;
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
  }
}
</style>
