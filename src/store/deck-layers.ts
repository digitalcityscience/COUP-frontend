import {MapboxLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";

export const tripsLayerName = "abmTrips"

export function  buildTripsLayer(cityPyoResponse): MapboxLayer {
  // todo get scenario and scenario props from user input
  const scenario = "scenario1"
  const prop1 = "prop1"
  const prop2 = "prop2"
  const props_string = prop1.toString() + "_" +prop2.toString()

  return new MapboxLayer({
    id: tripsLayerName,
    type: TripsLayer,
    data: cityPyoResponse.options.data[scenario][props_string].abm,
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

// animate deck trips layer
export function animate(layer: MapboxLayer, loop=false, start: number =null, end: number =null) {
  if (!start) {
    start = getLayerStartTime(layer)
  }
  if (!end) {
    end = getLayerEndTime(layer)
  }
  const loopLength = end - start
  const animationSpeed = 300 // unit time per second
  const timestamp = Date.now() / 1000
  const loopTime = loopLength / animationSpeed

  let time = ((timestamp % loopTime) / loopTime) * loopLength;

  // if loop - start over
  if (loop && time >= end) {
    time = start
  }

  // update current time on layer to move the dot
  (layer as MapboxLayer).implementation.setProps({currentTime: time})

  // as long as endTime of trips layer is not reached - call next frame iteration
  if (time <= end) {
    window.requestAnimationFrame(() => {
      animate(layer, loop, start, end);
    });
  }
}


function getLayerStartTime(layer: MapboxLayer) {
  return Math.min(...layer.implementation.props.data.map((d: any) => Math.min(...layer.implementation.props.getTimestamps(d))));
}

function getLayerEndTime(layer: MapboxLayer) {
  return Math.max(...layer.implementation.props.data.map((d: any) => Math.max(...layer.implementation.props.getTimestamps(d))));
}

