import { generateMutations } from "@/store/utils/generators";
import state from "./state";

export default {
  ...generateMutations(state),
  resultLoading(state: GenericObject, isLoading: boolean): void {
    console.log("resetting is loading", isLoading);
    state.resultLoading = isLoading;
  },
  updateStreetOrientation(state: GenericObject, payload: string): void {
    state.moduleSettings.main_street_orientation = payload;
  },
  moduleSettingsUpdate(state: GenericObject, payload: GenericObject): void {
    state.moduleSettings = {
      ...state.moduleSettings,
      ...payload,
    };
  },
};
