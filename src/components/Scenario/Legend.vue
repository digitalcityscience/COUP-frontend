<script>
import legends from '@/config/legends.json'

export default {
  name: "Legend",
  props: {
    topic: String
  },
  data() {
    return {
      legendHeadline: legends[this.topic]["headline"],
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
  <v-container class="component_content">
    <!-- LEGEND headline -->
    <v-row
      no-gutters
      class="mb-2"
      style="background-color: rgba(0,0,0,0.6);"
    >
      <v-col cols="2">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: rgba(0,0,0,0.6); margin-top: 5px;"
        >
          <v-icon style="color: #FFD529;">{{ icon }}</v-icon>
        </v-card>
      </v-col>
      <v-col cols="10">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: rgba(0,0,0,0.6);"
        >
          <p style="font-weight: bold">{{ legendHeadline }} </p>
        </v-card>
      </v-col>
    </v-row>

    <!-- Legend categories as v-for -->
    <v-row no-gutters
      v-for="item in legendCategories"
      class="mb-2 ml-0"
      style="background-color: rgba(0,0,0,0.6);"
    >
      <v-col cols="2">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: rgba(0,0,0,0.6); margin-top: 5px;"
        >
          <v-icon :color="item.color">mdi-square</v-icon>
        </v-card>
      </v-col>
      <v-col cols="9">
        <v-card
          class="pa-0"
          tile
          dark
          style="background-color: rgba(0,0,0,0.6);"
        >
          {{ item.label }}<br>
          <span v-if="item.detail">{{item.detail }} </span>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
  </div>
</template>

<style scoped lang="scss">
  @import "../../style.main.scss";


    .andre-legend {
      background-color: rgba(0,0,0,0.8) !important;
      color: white;

      .v-col {
        background-color: red !important;
      }
    }

    .legend {
      display: block;
      position: relative;
      width: 30px;
      //min-height:200px;
      max-width: 100%;
      padding: 5px;
      box-sizing: border-box;
      @include drop_shadow;
    }

    .v-btn {
      //width:40px;
      min-width: 0px;
      height: 30px;
      margin: 2px;
      background-color: rgba(0, 0, 0, 0.8) !important;
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
