import {Layer as MapboxLayer} from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";
import store from "../store/index"
import { DataSet } from '@deck.gl/core/lib/layer';


export const abmTripsLayerName = "abmTrips"

export async function buildTripsLayer(data: DataSet<any>): Promise<DeckLayer<any>> {

  //return new DeckLayer({
    const tripsLayer = new DeckLayer({
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
    highlightColor: [255, 56, 56],
    getWidth: 0.5,
    opacity: 0.15,
    widthMinPixels: 2,
    rounded: false,
    pickable:true,
    trailLength: 1000,
    currentTime: 0,
    // currentTime: this.props.sliders.time[1]
  });

  return tripsLayer;
}

// animate deck trips layer
export function animate(layer: DeckLayer<any>, start: number = null, end: number = null, time: number = null) {
  // stop animation, if trips layer no longer on map
  if (!store.state.abmScenario.designScenario) {
    console.log("stopped animation, because no scenario is selected")
    return
  }

  if (!start) {
    start = getLayerStartTime(layer)
  }
  if (!end) {
    end = getLayerEndTime(layer)
  }
  if (!time) {
    time = start
  }

  const animationSpeed = 7

  // if loop - start over
  if (time >= end) {
    time = start
  }

  // update current time on layer to move the dot
  (layer as DeckLayer<any>).setProps({currentTime: time})

  // as long as endTime of trips layer is not reached - call next frame iteration
  if (time <= end) {
    window.requestAnimationFrame(() => {
      animate(layer, start, end, time + animationSpeed);
    });
  }
}

function getLayerStartTime(layer: DeckLayer) {
  return Math.min(...layer.props.data.map((d: any) => Math.min(...layer.props.getTimestamps(d))));
}

function getLayerEndTime(layer: DeckLayer) {
  return Math.max(...layer.props.data.map((d: any) => Math.max(...layer.props.getTimestamps(d))));
}


