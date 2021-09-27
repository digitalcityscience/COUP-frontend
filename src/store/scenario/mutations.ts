import { generateMutations } from "@/store/utils/generators";
import state from "./state";

export default {
  ...generateMutations(state),
  resultLoading(state: GenericObject, isLoading: boolean) {
    console.log("resetting is loading", isLoading);
    state.resultLoading = isLoading;
  },
  updateStreetOrientation(state: GenericObject, payload: string) {
    state.moduleSettings.main_street_orientation = payload;
  },
  moduleSettingsUpdate(state: GenericObject, payload: { [key: string]: any }) {
    state.moduleSettings = {
      ...state.moduleSettings,
      ...payload,
    };
  },
  scenarioViewFilterUpdate(
    state: GenericObject,
    payload: { [key: string]: any }
  ) {
    state.scenarioViewFilters = {
      ...state.scenarioViewFilters,
      ...payload,
    };
  },
};
