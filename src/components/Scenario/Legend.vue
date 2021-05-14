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
  <!-- LEGEND with headline and all legendCategories as v-data-iterator -->
  <div class="button_bar">
    <v-btn class="legend"><v-icon style="color: #FFD529;">{{ icon }}</v-icon> <div class="infobox"><p>{{ legendHeadline }}</p></div></v-btn>
    <v-data-iterator
      :items="legendCategories"
      :hide-default-footer="true"
    >
      <template v-slot:default="{ items }">
        {{/* Use the items to iterate */}}
        <v-flex v-for="(item, index) in items" :key="index">
          <v-btn class="legend"><v-icon :color="item.color">mdi-square</v-icon>
            <div class="infobox">
              <p>
                {{ item.label }}
              </p>
            </div>
          </v-btn>
        </v-flex>
      </template>
    </v-data-iterator>
  </div>

</template>

<style scoped lang="scss">
  @import "../../style.main.scss";

  .button_bar {
    display: flex;
    flex-flow: column wrap;
    width: 40px;

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
  }

</style>
