export default {
    addLayer(state: StoreState, payload: ioLayer) {
        state.layers.push(payload)
    },
    removeLayer(state: StoreState, payload: ioLayer | string) {
        const id = typeof payload === 'string' ? payload : payload.id

        state.layers = state.layers.filter(l => l.id !== id)
    }
}
