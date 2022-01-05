<script lang="ts">
import AbmScenario from "@/components/Scenario/AbmScenario.vue";
import StormwaterScenario from "@/components/Scenario/StormwaterScenario.vue";
import NoiseScenario from "@/components/Scenario/NoiseScenario.vue";
import SunExposureScenario from "@/components/Scenario/SunExposure.vue";
import WindScenario from "@/components/Scenario/Wind.vue";
import MultiLayerAnalysis from "@/components/Scenario/MultiLayerAnalysis.vue";
import scenarioComponentNames from "@/config/scenarioComponentNames";
import { DataLoadingStati, ScenarioComponentName } from '@/models';

export default {
  name: "Menu",
  components: {
    AbmScenario,
    StormwaterScenario,
    NoiseScenario,
    WindScenario,
    SunExposureScenario,
    MultiLayerAnalysis,
  },
  props: {
    restrictedAccess: Boolean,
    context: String,
  },
  data() {
    return {
      windowWidth: window.innerWidth,
      menuOpen: false,
      componentNames: {...scenarioComponentNames},
      resultLoadingStati: {},
      notifyNewResult: {}
    };
  },
  computed: {
    activeComponent: {
      get() {
        return this.$store.state.activeMenuComponent;
      },
      set(value) {
        this.$store.commit("activeMenuComponent", value);
      },
    },
    showUi() {
      return this.$store.state.scenario.showUi;
    },
    resultLoadingStatiGlobal(): DataLoadingStati {
      return this.$store.state.scenario.resultLoadingStati;
    }
  },

  watch: {
    resultLoadingStatiGlobal: {
      // check if new a pending result has finished loading. 
      // If so, add a notification for new result for that component
      handler(newStati: DataLoadingStati){
            Object.entries(newStati).forEach(([componentName, isLoading]) => {
              if (!isLoading && this.resultLoadingStati[componentName]) {
                if (this.activeComponent !== componentName)
                this.notifyNewResult[componentName] = true;
              }
            })
          this.resultLoadingStati = { ...this.resultLoadingStatiGlobal };
        }, deep: true
    }
  }
};
</script>

<template>
  <div id="menu" :class="{ ui_hide: !showUi, menu_open: menuOpen }">
    <div
      class="mobile_button"
      v-if="windowWidth <= 1023"
      @click="menuOpen = !menuOpen"
    >
      <template v-if="menuOpen">
        <v-icon>mdi-close</v-icon>
      </template>
      <template v-else>
        <v-icon>mdi-menu</v-icon>
      </template>
    </div>
    <div class="menu_wrapper">
      <div v-if="context == 'grasbrook'" class="header_scope">
        <h3>Grasbrook CityScope</h3>
        <p>Tool for Functional Planning</p>
      </div>
      <div v-if="context == 'schb'" class="header_scope">
        <h3>Science City</h3>
        <p>Competition Tool</p>
      </div>
      <div class="component_switch">
        <template v-if="windowWidth >= 720">
          <ul class="component_list">
            <li
              class="component_link"
              v-bind:class="{ 
                selected: activeComponent === componentNames.pedestrian,
                waitingForResult: resultLoadingStati.pedestrian,
                newResultNotification: notifyNewResult.pedestrian
              }"
              @click="activeComponent = componentNames.pedestrian, notifyNewResult.pedestrian = false"
            >
              <p>Pedestrians</p>
            </li>
            <li
              class="component_link"
              v-bind:class="{
                selected: activeComponent === componentNames.stormwater,
                waitingForResult: resultLoadingStati.stormwater,
                newResultNotification: notifyNewResult.stormwater
              }"
              @click="activeComponent = componentNames.stormwater, notifyNewResult.stormwater = false"
            >
              <p>Stormwater</p>
            </li>
            <li
              class="component_link"
              v-bind:class="{ 
                selected: activeComponent === componentNames.noise,
                waitingForResult: resultLoadingStati.noise,
                newResultNotification: notifyNewResult.noise
                }"
              @click="activeComponent = componentNames.noise, notifyNewResult.noise = false"
            >
              <p>Noise</p>
            </li>
            <li
              class="component_link"
              v-bind:class="{ 
                selected: activeComponent === componentNames.wind,
                waitingForResult: resultLoadingStati.wind,
                newResultNotification: notifyNewResult.wind

                }"
              @click="activeComponent = componentNames.wind, notifyNewResult.wind = false"
            >
              <p>Wind</p>
            </li>
            <li
              class="component_link"
              v-bind:class="{
                selected: activeComponent === componentNames.sun,
                waitingForResult: resultLoadingStati.sun,
                newResultNotification: notifyNewResult.sun
              }"
              @click="activeComponent = componentNames.sun, notifyNewResult.sun = false"
            >
              <p>Sun</p>
            </li>
            <li
              class="component_link"
              v-bind:class="{
                selected: activeComponent === componentNames.multiLayer,
                waitingForResult: resultLoadingStati.multiLayer,
                newResultNotification: notifyNewResult.multiLayer
              }"
              @click="activeComponent = componentNames.multiLayer, notifyNewResult.multiLayer = false"
            >
              <p>Combine Layers</p>
            </li>
          </ul>
        </template>
        <template v-else>
          <select class="mobile_select" v-model="activeComponent">
            <option :value="componentNames.pedestrian">Pedestrians</option>
            <option :value="componentNames.stormwater">Stormwater</option>
            <option :value="componentNames.noise">Noise</option>
            <option :value="componentNames.wind">Wind</option>
            <option :value="componentNames.sun">Sun</option>
            <option :value="componentNames.multiLayer">Combine Layers</option>
          </select>
        </template>
      </div>
      <div class="body_scope">
        <div v-if="activeComponent === componentNames.pedestrian">
          <AbmScenario
            :restrictedAccess="restrictedAccess"
            :context="context"
          />
        </div>
        <div v-if="activeComponent === componentNames.stormwater">
          <StormwaterScenario />
        </div>
        <div v-if="activeComponent === componentNames.noise">
          <NoiseScenario />
        </div>
        <div v-if="activeComponent === componentNames.wind">
          <WindScenario />
        </div>
        <div v-if="activeComponent === componentNames.sun">
          <SunExposureScenario/>
        </div>
        <div v-if="activeComponent === componentNames.multiLayer">
          <MultiLayerAnalysis />
        </div>
      </div>
      <div class="footer_scope"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

#menu {
  position: fixed;
  top: 0;
  left: 100vw;
  width: 340px;
  height: 100vh;
  transform: translateX(0);
  border-left: 1px solid #888;
  font-family: "Tajawal", sans-serif;
  backdrop-filter: blur(5px) saturate(140%);
  z-index: 1000;

  &.ui_hide {
    transform: translateX(100vw);
    transition: 0.3s;
  }

  .header_scope {
    h3 {
      width: 100%;
      padding: 10px 20px 0px 20px;
      box-sizing: border-box;
      text-align: left;
      font-size: 110%;
      color: $bright1;
    }
    p {
      width: 100%;
      padding: 0px 20px 10px 20px;
      box-sizing: border-box;
      text-align: left;
      font-size: 90%;
      color: $bright2;
    }
  }

  .component_switch {
    width: 100%;

    .component_list {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      list-style: none;
      padding: 0;
      width: 90%;
      margin: auto;

      .component_link {
        position: relative;
        height: 30px;
        line-height: 30px;
        padding: 0px 20px;
        box-sizing: border-box;
        margin: 3px;
        text-align: center;

        p {
          color: $bright1;
          font-size: 80%;
        }

        &:after {
          background: $reversed;
          opacity: 0.35;
          z-index: -1;
          @include fullpseudo;
        }

        &:hover {
          cursor: pointer;

          &:after {
            opacity: 0.5;
          }
        }

        &.selected {
          outline: 1px solid $bright1;

          &:after {
            opacity: 0.65;
          }
        }

        &.waitingForResult {
          overflow:hidden;
          background: $reversed;
          opacity: 0.35;
          color: $bright1;
          
          &:hover {
              animation:none;
              -webkit-animation: none;
          }

          &:after {
            background:linear-gradient(45deg, white, $darkred);
            animation:pulse-border 2.5s infinite;
            -webkit-animation:pulse-border 2.5s infinite;
          }
        }
        
        &.newResultNotification {
          overflow:hidden;
          background:linear-gradient(45deg, white, green);
          opacity: 0.35;
          color: $bright1;
        }
      }
    }
  }

  .body_scope {
  }
  .footer_scope {
  }

  @media (min-device-width: 1024px) {
    right: 0;
    left: auto;
    width: 30vw;
    max-width: 340px;
    transform: translateX(0);
    background: rgba(0, 0, 0, 0.8);

    .menu_wrapper {
      width: 100%;
      height: 100vh;
      margin: 0 auto;
    }
  }

  @media (max-device-width: 1023px) {
    width: 340px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(10px);

    .menu_wrapper {
      width: 100%;
      height: 100vh;
      margin: 0 auto;
      overflow: auto;

      select {
        position: relative;
        width: calc(100% - 20px);
        margin: 10px;
        height: 50px;
        border: 1px solid #888;
        text-align: left;
        padding: 0px 10px;
        box-sizing: border-box;
        color: whitesmoke;

        option {
          color: #222;
        }

        &:after {
          content: "";
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: -1;
          background: $greyblue;
          opacity: 0.5;
        }
      }
    }

    &.menu_open {
      transform: translateX(-340px);
      transition: 0.3s;

      .mobile_button {
        right: 10px;
        top: 10px;
        left: auto;
        background: transparent;
        border: 1px solid #aaa;

        .v-icon {
          color: whitesmoke;
        }
      }
    }

    .mobile_button {
      width: 40px;
      height: 40px;
      position: absolute;
      left: -40px;
      top: 20px;
      background: rgba(255, 255, 255, 0.95);
      @include drop_shadow;

      .v-icon {
        margin: 10px auto;
        font-size: 20px;
        color: black;
      }
    }

    .body_scope {
    }
  }

  @media (max-device-width: 720px) {
    width: 100vw;
    padding: 30px;
    box-sizing: border-box;

    &.menu_open {
      transform: translateX(-100vw);
    }
  }
}
</style>
