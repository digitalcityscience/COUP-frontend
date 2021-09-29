<template>
  <div class="buildings-legend">
    <!-- iterate over all items in legendCategories and display icon and label for each -->
    <v-data-iterator
      :items="buildingUses.categories"
      :hide-default-footer="true"
    >
      <template v-slot:default="{ items }">
        <!-- Each legend category has an icon, color and a label to display -->
        <v-flex v-for="(item, index) in items" :key="index">
          <v-btn class="legend">
            <v-icon :color="item.color" size="18">{{
              buildingUses.icon
            }}</v-icon>
            <div class="infobox">
              <p>{{ item.label }}</p>
            </div>
          </v-btn>
        </v-flex>
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import legends from "@/config/legends.json";

@Component
export default class BuildingsLegend extends Vue {
  buildingUses = legends.buildingUses;
}
</script>

<style lang="scss" scoped>
@import "@/style/mixins.scss";

.buildings-legend {
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
