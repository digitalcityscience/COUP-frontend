import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import {ArcLayer} from "@deck.gl/layers";
import {TripsLayer} from "@deck.gl/geo-layers";
import GL from '@luma.gl/constants';
import store from "../store/index"
// @ts-ignore
import {DataSet} from "@deck.gl/core/lib/layer";


export const abmTripsLayerName = "abmTrips"
export const abmAggregationLayerName = "abmHeat"
export const abmArcLayerName = "abmArcs"

export async function buildTripsLayer(data: DataSet<any>, currentTimeStamp: number): Promise<DeckLayer<any>> {

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
        getColor: () => {
          return [16,245,229];
          //return [253,128,93];
        },
        //highlightColor: [255, 56, 56],
        getWidth: 1,
        opacity: 0.3,
        widthMinPixels: 2,
        rounded: true,
        pickable:false,
        trailLength: 750,
        currentTime: currentTimeStamp,
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

export async function buildArcLayer(arcLayerData) {

  return new DeckLayer({
    id: abmArcLayerName,
    type: ArcLayer,
    data: arcLayerData,
    pickable: true,

    getWidth: d => d.width,

    getSourcePosition: d => d.source,
    getTargetPosition: d => d.target,
    getSourceColor: d=> d.color,
    getTargetColor: d=> d.color,
  })
}


export async function buildAggregationLayer(data: DataSet<any>, type): Promise<DeckLayer<any>> {

  const aggregationLayer = new DeckLayer({
    id: abmAggregationLayerName,
    type:HeatmapLayer,
    data: data,
    pickable: false,
    getPosition:  d => d.c,
    getWeight: type == "default" ? d => d.w : 1,
    intensity: type == "default" ? 20 : 3,
    threshold: type == "default" ? 10 : 0.5,
    radiusPixels: type == "default" ? 50 : 70,
    opacity:type == "default" ? 0.8 : 0.8,
    visible:true,
  })

  aggregationLayer.props.visible = function() {
    return (aggregationLayer.map.getZoom() < 17.5)
  }

  return aggregationLayer;
}

// animate deck trips layer
export function animate(layer: DeckLayer<any>, start: number = null, end: number = null, time: number = null) {

  // stop animation, if trips layer no longer on map
  if (!store.state.scenario.bridges) {
    console.log("stopped animation, because no scenario is selected")
    return
  }


  const loop = store.state.scenario.loop;
  const setLoop = store.state.scenario.setLoop;
  const range = store.state.scenario.selectedRange;

  if(loop && setLoop){
    start = (range[0] - 8) * 3600;
    end = (range[1] - 8) * 3600;
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

  if(time <= start){
    time = start;
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


