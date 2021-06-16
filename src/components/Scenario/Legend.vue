<script>
import legends from '@/config/legends.json'

export default {
  name: "Legend",
  props: {
    topic: String
  },
  data() {
    return {
      legendExplanation: legends[this.topic]["headline"],
      legendCategories: legends[this.topic]["categories"],
      icon: legends[this.topic]["icon"]
    }
  },
  mounted(){
  },
}
</script>

<template>
  <div>
  <v-container class="component_content info_section">
    <p class="legend_headline">LEGEND</p>

    <p class="legend_explanation">{{ legendExplanation }}</p>

    <!-- Legend categories as v-for -->
    <v-row no-gutters
      v-for="item in legendCategories"
      class="mb-0 ml-0"
      align="center"
      justify="space-in-between"
    >
      <v-col cols="2">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: inherit"
        >
          <v-icon :color="item.color">mdi-square</v-icon>
        </v-card>
      </v-col>
      <!-- this will be wrapped as a new line into the same col as above,
      as the column width sum up to more than 12. -->
      <v-col cols="9">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: inherit"
        >
          {{ item.label }}
        </v-card>
      </v-col>
      <v-col
        v-if="item.detail"
        cols="12"
        class="mb-2 ml-11"
        style="line-height: 0.7"
      >
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: inherit"
        >
          {{ item.detail }}
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  </div>
</template>

<style scoped lang="scss">
  @import "../../style.main.scss";

    .legend_headline {
      margin-left: -20px;
      font-weight: bold;
    }

    .legend_explanation {
      margin-left: -20px;
      margin-top: -15px;
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
