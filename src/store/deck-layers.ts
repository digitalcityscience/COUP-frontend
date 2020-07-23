import {Layer as MapboxLayer} from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";

export const abmTripsLayerName = "abmTrips"

export function buildTripsLayer(data: Object): DeckLayer {
  return new DeckLayer({
    id: abmTripsLayerName,
    type: TripsLayer,
    data: data,
    getPath: (d) => {
      return d.path
    },
    getTimestamps: (d) => {
      return d.timestamps
    },
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
export function animate(layer: MapboxLayer, start: number = null, end: number = null) {
  if (!start) {
    start = getLayerStartTime(layer)
  }
  if (!end) {
    end = getLayerEndTime(layer)
  }

  const loopLength = end - start
  const animationSpeed = 1000 // unit time per second
  const timestamp = Date.now() / 1000
  const loopTime = loopLength / animationSpeed

  let time = ((timestamp % loopTime) / loopTime) * loopLength;

  // if loop - start over
  if (time >= end) {
    time = start
  }

  // update current time on layer to move the dot
  (layer as DeckLayer).setProps({currentTime: time})

  // as long as endTime of trips layer is not reached - call next frame iteration
  if (time <= end) {
    window.requestAnimationFrame(() => {
      animate(layer, start, end);
    });
  }
}

function getLayerStartTime(layer: DeckLayer) {
  return Math.min(...layer.props.data.map((d: any) => Math.min(...layer.props.getTimestamps(d))));
}

function getLayerEndTime(layer: DeckLayer) {
  return Math.max(...layer.props.data.map((d: any) => Math.max(...layer.props.getTimestamps(d))));
}


