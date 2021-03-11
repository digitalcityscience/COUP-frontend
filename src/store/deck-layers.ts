import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {HeatmapLayer} from '@deck.gl/aggregation-layers';
import {ArcLayer} from "@deck.gl/layers";
import {TripsLayer} from "@deck.gl/geo-layers";
import {PolygonLayer} from '@deck.gl/layers';
import GL from '@luma.gl/constants';
import store from "../store/index"
// @ts-ignore
import {DataSet} from "@deck.gl/core/lib/layer";
import { mdiConsoleNetworkOutline } from "@mdi/js";


export const abmTripsLayerName = "abmTrips"
export const abmAggregationLayerName = "abmHeat"
export const abmArcLayerName = "abmArcs"
export const swLayerName = "stormwater"

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

//export function buildSWLayer(data: DataSet<any>) {
export async function buildSWLayer(data: DataSet<any>, time) {

  var stormWaterLayer = new DeckLayer({
    id: swLayerName,
    type:PolygonLayer,
    data: data,
    pickable: true,
    filled: true,
    opacity: 0.75,
    extruded:true,
    getElevation:0,
    swTime:0,
    getPolygon: d => d.geometry,
    //getFillColor,
    getFillColor: d => getPolygonColor(d.runoff[time]),
    visible:true,
  });
  return stormWaterLayer;
}

export function getPolygonColor(d){
    if(d <= 5) {
      return [12,45,140]
    }
    if (d > 5 && d <= 20) {
      return [16,37,199]
    }
    if (d > 20 && d <= 30) {
      return [58,90,250]
    }
    if (d > 30 && d <= 50) {
      return [100,130,250]
    }
    if (d > 50 && d <= 80) {
      return [166,188,250]
    }
    if (d > 80 && d <= 100) {
      return [218,232,250]
    }
    if (d > 100 && d <= 120) {
      return [236,249,229]
    }
    if (d > 120 && d <= 150) {
      return [250,244,152]
    }
    if (d > 150 && d <= 180) {
      return [247,213,62]
    }
    if (d > 180 && d <= 210) {
      return [224,160,73]
    }
    if (d > 210 && d <= 230) {
      return [224,85,63]
    }
    if (d > 230 && d <= 270) {
      return [130,21,9]
    }
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


