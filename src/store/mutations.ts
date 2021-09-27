export default {
  addLayerId(state: StoreState, id: string) {
    if (!state.layerIds.includes(id)) {
      console.log("new layer added with id", id);
      state.layerIds.push(id);

      console.log(state.map);
    }
  },
  removeLayerId(state: StoreState, id: string) {
    state.layerIds = state.layerIds.filter((_id) => _id !== id);
  },
};
