import {Layer as MapboxLayer} from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import {TripsLayer} from "@deck.gl/geo-layers";
import GL from '@luma.gl/constants';
import store from "../store/index"
import { DataSet } from "@deck.gl/core/lib/layer";


export const abmTripsLayerName = "abmTrips"
export const abmAggregationLayerName = "abmHeat"

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
        getWidth: 1,
        opacity: 0.2,
        widthMinPixels: 2,
        rounded: true,
        pickable:false,
        trailLength: 750,
        currentTime: 0,
        parameters: {
          // prevent flicker from z-fighting
          [GL.DEPTH_TEST]: false,
      
          // blending for abm
          [GL.BLEND]: true,
          //[GL.BLEND_COLOR]: [253, 128, 93,100],
          [GL.BLEND_COLOR]: [0, 20, 255,100],
          //[GL.BLEND_SRC_RGB]: GL.ONE,
          [GL.BLEND_DST_RGB]: GL.ONE,
          [GL.BLEND_EQUATION]: GL.FUNC_ADD,
          [GL.BLEND_DST_ALPHA]: GL.ONE,
          //[GL.BLEND_SRC_ALPHA]: GL.ONE,
        },
        // currentTime: this.props.sliders.time[1]
    });

    return tripsLayer;
}

export async function buildAggregationLayer(data: DataSet<any>): Promise<DeckLayer<any>> {
  const testData = [
    { Coordinates: [10.013102024494415,53.528981608728], Weight: 3} ,
    { Coordinates: [10.013175558483056,53.531871082921064], Weight: 7},
    { Coordinates: [10.025822883113655,53.524985242386215], Weight:1}
  ];
  const aggregationLayer = new DeckLayer({
    id: abmAggregationLayerName,
    type:HeatmapLayer,
    data: data,
    pickable: false,
    getPosition:  d => d.Coordinates,
    getWeight: d => d.Weight,
    intensity: 7,
    threshold: 0.03,
    radiusPixels: 50,
    opacity:0.5,
    visible:true,
  })

  return aggregationLayer;
}

// animate deck trips layer
export function animate(layer: DeckLayer<any>, start: number = null, end: number = null, time: number = null) {
  // stop animation, if trips layer no longer on map
  if (!store.state.scenario.bridges) {
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

  // if loop - start over
  if (time >= end) {
    time = start
  }

  //get animation values from Store
  const animationSpeed = store.state.scenario.animationSpeed;
  const animationRunning = store.state.scenario.animationRunning;

  /*const currentTimeStamp = store.state.scenario.currentTimeStap;
  if(currentTimeStamp > start || currentTimeStamp < end){
    time = currentTimeStamp;
  }*/

  //commit currentTime to Store
  store.commit("scenario/currentTimeStamp", time + animationSpeed);

  // update current time on layer to move the dot
  (layer as DeckLayer<any>).setProps({currentTime: time})

  // as long as endTime of trips layer is not reached - call next frame iteration
  if (time <= end && animationRunning) {
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


