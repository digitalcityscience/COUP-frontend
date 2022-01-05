<script lang="ts">
import { mapState } from "vuex";
import { Component, Vue } from "vue-property-decorator";
import { Store } from "vuex";
import { DataLoadingStati, ScenarioComponentName, StoreStateWithModules } from "@/models";


@Component({
  name: "LoaderScreen",
  components: {}
})

export default class LoaderScreen extends Vue {
    $store: Store<StoreStateWithModules>;

    // TODO rename menucomponent to scenarioComponent
    get activeScenarioComponent(): string {
    return this.$store.state.activeMenuComponent;
    }

    get dataLoadingStati(): DataLoadingStati {
      return this.$store.state.scenario.resultLoadingStati;
    }

    /** show loader if result data for the current scenario component is loading - or for general/misc data loading */
    get showLoader(): boolean {
      return this.dataLoadingStati[this.activeScenarioComponent] || this.dataLoadingStati.map
    }

    /** looks for which loading status is true and returns associated text */
    get loaderTxt(): string {
      if (this.dataLoadingStati.map) {
        return "....Loading...Please wait.."
      }

      const loaderTexts: Record<ScenarioComponentName, string> = {
        sun: "Fetching sun exposure results.",
        wind: "Fetching wind-comfort results from Infrared.",
        noise: "Fetching traffic noise results.",
        pedestrian: "Fetching ABM results.",
        stormwater: "Fetching stormwater results.",
        multiLayer: "Calculation in progress.",
      }

      return loaderTexts[this.activeScenarioComponent]
    }
}
</script>


<template>
  <div id="big_loader" :class="showLoader ? '' : 'hidden'">
    <div class="css-loader">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <div class="loader_text">{{ loaderTxt }}</div>
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

#big_loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  backdrop-filter: blur(5px) saturate(180%);
  transform: scale(1);
  background: radial-gradient(
    rgba(0, 0, 0, 0.25),
    rgba(0, 0, 0, 0.95),
    rgba(0, 0, 0, 1)
  );
  transition: 0.3s;

  &.hidden {
    transition: 0.3s;
    opacity: 0;
    transform: scale(2);
    pointer-events: none;
  }

  .css-loader {
    position: absolute;
    display: block;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.75);
    opacity: 0.95;
    width: 30px;
    height: 30px;
    div {
      position: absolute;
      top: 33px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #fff;
      animation-timing-function: cubic-bezier(0, 1, 1, 0);
    }

    div:nth-child(1) {
      left: 3px;
      animation: lds-ellipsis1 0.6s infinite;
    }
    div:nth-child(2) {
      left: 3px;
      animation: lds-ellipsis2 0.6s infinite;
    }
    div:nth-child(3) {
      left: 12px;
      animation: lds-ellipsis2 0.6s infinite;
    }
    div:nth-child(4) {
      left: 21px;
      animation: lds-ellipsis3 0.6s infinite;
    }
  }

  .loader_text {
    position: absolute;
    top: calc(50% + 50px);
    transform: translateY(-50%);
    width: 100%;
    text-align: center;
    color: whitesmoke;
    font-size: 80%;
  }
}

@keyframes lds-ellipsis1 {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes lds-ellipsis3 {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}

@keyframes lds-ellipsis2 {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(9px, 0);
  }
}
</style>
