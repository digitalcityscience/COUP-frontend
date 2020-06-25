const INITIAL_VIEW_STATE = {
    latitude: 53.53128461384861,
    longitude: 10.0143909533867,
    zoom: 13,
    pitch: 0,
    bearing: 0
};

const DEFAULT_LAYER_OPTIONS_GEOJSON = {
    pickable: true,
    autoHighlight: true,
    stroked: false,
    filled: true,
    extruded: false,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    getFillColor: [160, 160, 180, 200],
    getLineColor: [160, 160, 180, 200],
    getRadius: 100,
    getLineWidth: 1,
    getElevation: 30,
    onHover: ({object, x, y}) => {
      const tooltip = object.properties.name || object.properties.station;
      /* Update tooltip
         http://deck.gl/#/documentation/developer-guide/adding-interactivity?section=example-display-a-tooltip-for-hovered-object
      */
    }
}

export {INITIAL_VIEW_STATE, DEFAULT_LAYER_OPTIONS_GEOJSON}