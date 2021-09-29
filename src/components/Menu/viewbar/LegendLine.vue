<template>
  <div class="legend-line">
    <v-btn class="legend">
      <v-tooltip right nudge-right="10">
        <template v-slot:activator="{ on, attrs }">
          <v-icon :color="color" v-bind="attrs" v-on="on" size="18">
            {{ icon }}
          </v-icon>
        </template>
        <span>{{ label }}</span>
      </v-tooltip>
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
@import "@/style/viewbar-button.scss";

.legend-line {
  .v-btn {
    @include viewbar-button;

    &.legend {
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
