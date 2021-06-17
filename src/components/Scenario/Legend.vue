<script>
import legends from '@/config/legends.json'

export default {
  name: "Legend",
  props: {
    topic: String,
    showAtBottom: Boolean
  },
  data() {
    return {
      legendExplanation: legends[this.topic]["headline"],
      legendCategories: legends[this.topic]["categories"],
      labelLowValues: legends[this.topic]["labelLowValues"],
      labelHighValues: legends[this.topic]["labelHighValues"]
    }
  },
  mounted(){
    console.log("test", this.showAtBottom)
  },
}
</script>

<template>
  <div v-if="showAtBottom" id="bottom-legend">
    <v-container>
      <v-row class="flex-nowrap">
        <v-col style="background-color: rgba(0,0,0,0.5);">{{ labelLowValues}}</v-col>
        <v-col no-gutters
               v-for="item in legendCategories"
               class="pa-0 ml-1"
               align="center"
               cols="2"
               xm="1"
               :style="'background-color:' + item.color"
        >
         </v-col>
        <v-col style="background-color: rgba(0,0,0,0.5);">{{ labelHighValues}}</v-col>
      </v-row>
    </v-container>
  </div>

  <div v-else>
  <v-container class="component_content info_section">
    <div class="legend_headline">LEGEND</div>
    <div class="legend_explanation">{{ legendExplanation }}</div>

    <!-- Legend categories as v-for -->
    <v-row no-gutters
      v-for="item in legendCategories"
      class="mb-0 ml-0"
      align="center"
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

    #bottom-legend {
      position: absolute !important;
      bottom: 10vh;
      height: 20px;
      width: 100%;
      right: 70vw;
      float:left;
      color: whitesmoke;

      @media(max-device-height: 1600px) {
       bottom: 120px;
      }
      @media(max-device-width: 1023px) {
       right: 90vw;
      }
      @media(max-device-width: 900px) {
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
