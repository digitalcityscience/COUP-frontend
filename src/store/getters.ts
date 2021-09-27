export default {
  layer: (s: StoreState) => (id: string) => s.map.getLayer(id),
  source: (s: StoreState) => (id: string) => s.map.getSource(id),
};
