import {MapboxLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";

export function  buildTripsLayer(sourceConfig, cityPyoResponse): MapboxLayer {
  console.log("building trips layer")
  console.log(cityPyoResponse)

  return new MapboxLayer({
    id: sourceConfig.id,
    type: TripsLayer,
    data: cityPyoResponse.options.data.abm,
    getPath: (d) => d.path,
    getTimestamps: (d) => d.timestamps,
    getColor: [253, 128, 93],
    getWidth: 1,
    opacity: 0.8,
    widthMinPixels: 5,
    rounded: true,
    trailLength: 500,
    currentTime: 100,
    // currentTime: this.props.sliders.time[1]
  });
}

export function animateLayer(layer: MapboxLayer, loop = true) {
  const endTime: number = Math.max(...layer.props.data.map((d: any) => Math.max(...layer.props.getTimestamps(d))));

  layer.updater = setInterval(() => {
    let currentTime = (layer as MapboxLayer).props.currentTime + 20;

    if (currentTime > endTime) {
      if (loop) {
        currentTime = 0;
      } else {
        clearInterval(layer.updater);
      }
    }

    (layer as MapboxLayer).setProps({currentTime});
  }, 20);
}
