<template>
  <div class="buildings-legend">
    <!-- iterate over all items in legendCategories and display icon and label for each -->
    <v-data-iterator
      :items="buildingUses.categories"
      :hide-default-footer="true"
    >
      <template v-slot:default="{ items }">
        <v-flex v-for="(item, index) in items" :key="index">
          <LegendLine
            :label="item.label"
            :color="item.color"
            :icon="buildingUses.icon"
          />
        </v-flex>
      </template>
    </v-data-iterator>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import legends from "@/config/userInteraction/legends";
import LegendLine from "@/components/Menu/viewbar/LegendLine.vue";

@Component({
  components: { LegendLine },
})
export default class BuildingsLegend extends Vue {
  buildingUses = legends.buildingUses;
}
</script>

<style lang="scss" scoped></style>
