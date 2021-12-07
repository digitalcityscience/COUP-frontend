import { StoreState } from "@/models";

export default {
  addLayerId(state: StoreState, id: string) {
    if (!state.layerIds.includes(id)) {
      console.log("new layer added with id", id);
      state.layerIds.push(id);
    }
  },
  removeLayerId(state: StoreState, id: string) {
    state.layerIds = state.layerIds.filter((_id) => _id !== id);
  },
};
