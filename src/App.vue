<template>
  <v-app>
    <Map :restrictedAccess="restrictedAccess" />
    <Menu :restrictedAccess="restrictedAccess" :context="context" />
    <TimeSheet :hidden="!showTimeSheet" :timeSheetContext="timeSheetContext" />
    <Viewbar :restrictedAccess="restrictedAccess" />
    <Loader />
    <LogosAIT />
    <div id="line_canvas"></div>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import Map from "./components/Map/Map.vue";
import Menu from "./components/Menu/Menu.vue";
import Viewbar from "./components/Menu/Viewbar.vue";
import TimeSheet from "./components/Scenario/TimeSheet.vue";
import LogosAIT from "./components/Scenario/LogosAIT.vue";
import Loader from "./components/Loader/Loader.vue";
import type { StoreState, TimeSheetContext } from "@/models";
import type { Store } from "vuex";
import ScenarioComponentNames from "./config/scenarioComponentNames";

@Component({
  components: {
    Map,
    TimeSheet,
    Menu,
    Viewbar,
    Loader,
    LogosAIT,
  },
})
export default class App extends Vue {
  $store: Store<StoreState>;

  @Prop()
  restrictedAccess!: boolean;
  @Prop()
  context!: string;

  get activeComponent(): string {
    return this.$store.state.activeMenuComponent;
  }

  get timeSheetContext(): TimeSheetContext {
    if (this.activeComponent === ScenarioComponentNames.pedestrian) {
      return "abm";
    }
    if (this.activeComponent === ScenarioComponentNames.stormwater) {
      return "stormwater";
    }

    return null;
  }

  get showTimeSheet(): boolean {
    return (
      this.activeComponent === ScenarioComponentNames.pedestrian ||
      this.activeComponent === ScenarioComponentNames.stormwater
    );
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

Map,
GFI,
TimeSheet {
  z-index: 2;
}

Menu,
Viewbar {
  z-index: 7;
}

.v-application p {
  margin-bottom: 0px;
}

#line_canvas {
  position: fixed;
  top: 0;
  left: 0;
  /*width:100vw;
        height:100vh;*/
  z-index: 2;
  background: transparent;
  pointer-events: none;
}
</style>
