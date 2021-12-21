<template>
  <div v-if="showAtBottom" id="bottom-legend">
    <v-container>
      <v-row class="flex-nowrap legend-row">
        <v-col>
          {{ legend.labelLowValues }}
        </v-col>
        <v-col
          no-gutters
          v-for="category in legend.categories"
          v-bind:key="category.label"
          class="px-1 py-5 category-color"
          cols="1"
        >
          <div
            class="color-block"
            :style="'background-color:' + category.color"
          />
        </v-col>
        <v-col>{{ legend.labelHighValues }}</v-col>
      </v-row>
    </v-container>
  </div>

  <div v-else>
    <v-container class="component_content info_section">
      <div class="legend_headline">LEGEND</div>
      <div class="legend_explanation">{{ legend.headline }}</div>

      <!-- Legend categories as v-for -->
      <v-row
        no-gutters
        v-for="category in legend.categories"
        v-bind:key="category.label"
        class="mb-0 ml-0"
        align="center"
      >
        <v-col cols="2">
          <v-card class="pa-0" tile dark style="background-color: inherit">
            <v-icon :color="category.color">mdi-square</v-icon>
          </v-card>
        </v-col>
        <!-- this will be wrapped as a new line into the same col as above,
      as the column width sum up to more than 12. -->
        <v-col cols="9">
          <v-card class="pa-0" tile dark style="background-color: inherit">
            {{ category.label }}
          </v-card>
        </v-col>
        <v-col
          v-if="category.detail"
          cols="12"
          class="mb-2 ml-11"
          style="line-height: 0.7"
        >
          <v-card class="pa-0" tile dark style="background-color: inherit">
            {{ category.detail }}
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import legends from "@/config/userInteraction/legends";
import { Legend as LegendModel } from "@/models";

@Component
export default class Legend extends Vue {
  @Prop()
  topic!: string;
  @Prop()
  showAtBottom!: boolean;

  get legend(): LegendModel {
    return legends[this.topic];
  }
}
</script>

<style scoped lang="scss">
@import "@/style/mixins.scss";

#bottom-legend {
  position: absolute !important;
  bottom: 25px !important;
  height: 20px;
  width: 100%;
  right: 70vw;
  float: left;
  color: whitesmoke;

  .category-color {
    align-self: center;

    .color-block {
      height: 10px;
    }
  }
  .col {
    background-color: rgba(0, 0, 0, 0.5);
  }

  @media (max-device-width: 1600px) {
    display: none;
  }
}

.legend_headline {
  margin-left: -20px;
  font-weight: bold;
}

.legend_explanation {
  margin-left: -20px;
  margin-bottom: 16px;
}

.v-btn {
  //width:40px;
  min-width: 0px;
  height: 30px;
  margin: 2px;
  background-color: rgba(0, 0, 0, 0.8) !important;
  backdrop-filter: blur(5px) saturate(140%);
  @include drop_shadow;

  &.legend {
    pointer-events: none;

    .infobox {
      width: 115px;
      height: 34px;
      position: absolute;
      top: 0;
      left: 34px;
      @include drop_shadow;

      p {
        text-transform: none;
        color: whitesmoke;
        line-height: 20px;
        font-size: 100%;
        font-weight: 400;
      }
    }
  }

  .v-icon {
    font-size: 18px;
  }
}
</style>
