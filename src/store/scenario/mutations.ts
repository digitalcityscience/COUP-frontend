export default {
  abmResultLoading(state: GenericObject, isLoading: boolean) {
    console.log("resetting is loading", isLoading)
    state.isLoading = isLoading
  }
}
