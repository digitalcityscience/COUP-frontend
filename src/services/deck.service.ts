// @ts-ignore
import { MapboxLayerProps } from "@deck.gl/mapbox/mapbox-layer";
// @ts-ignore
import { DataSet } from "@deck.gl/core/lib/layer";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { TripsLayer } from "@deck.gl/geo-layers";
import GL from "@luma.gl/constants";
import { PolygonLayer } from "@deck.gl/layers";
import { MapboxLayer as DeckLayer } from "@deck.gl/mapbox";
import type { AbmTimeRange, AgentsClusteredForHeatmap, GeoJSON } from "@/models";

export const abmTripsLayerName = "abmTrips";
export const abmAggregationLayerName = "abmHeat";

export function buildSWLayer(
  geojson: GeoJSON,
  time: number
): DeckLayer<unknown> {
  return new DeckLayer({
    id: "stormwater",
    type: PolygonLayer,
    data: geojson?.features,
    pickable: true,
    filled: true,
    opacity: 0.75,
    extruded: true,
    getElevation: 0,
    getPolygon: (d: any) => d.geometry.coordinates.flat(1),
    getFillColor: (d) =>
      getPolygonColor(d["properties"]["runoff_results"]["runoff_value"][time]),
    visible: true,
  } as unknown as MapboxLayerProps<unknown>);
}

export function getPolygonColor(d: number): [number, number, number] {
  if (d <= 0.2) {
    return [12, 45, 140];
  }
  if (d > 0.2 && d <= 0.4) {
    return [16, 37, 199];
  }
  if (d > 0.4 && d <= 0.6) {
    return [58, 90, 250];
  }
  if (d > 0.6 && d <= 0.8) {
    return [100, 130, 250];
  }
  if (d > 0.8 && d <= 1.0) {
    return [166, 188, 250];
  }
  if (d > 1.0 && d <= 2.0) {
    return [218, 232, 250];
  }
  if (d > 2.0 && d <= 4.0) {
    return [236, 249, 229];
  }
  if (d > 4.0 && d <= 8.0) {
    return [250, 244, 152];
  }
  if (d > 8.0 && d <= 16) {
    return [247, 213, 62];
  }
  if (d > 16 && d <= 32) {
    return [224, 160, 73];
  }
  if (d > 32 && d <= 64) {
    return [224, 85, 63];
  }
  if (d > 64 && d <= 128) {
    return [130, 21, 9];
  }
}

export async function buildTripsLayer(
  data: DataSet<any>,
  currentTimeStamp: number
): Promise<DeckLayer<unknown>> {
  return new DeckLayer({
    id: abmTripsLayerName,
    type: TripsLayer,
    data: data,
    getPath: (d) => {
      return d.path;
    },
    getTimestamps: (d) => {
      return d.timestamps;
    },
    getColor: () => {
      return [16, 245, 229];
      //return [253,128,93];
    },
    //highlightColor: [255, 56, 56],
    getWidth: 1,
    opacity: 0.3,
    widthMinPixels: 2,
    rounded: true,
    pickable: false,
    trailLength: 750,
    currentTime: currentTimeStamp,
    parameters: {
      // prevent flicker from z-fighting
      [GL.DEPTH_TEST]: false,

      // blending for abm
      [GL.BLEND]: true,
      //[GL.BLEND_COLOR]: [253, 128, 93,100],
      [GL.BLEND_COLOR]: [0, 20, 255, 100],
      //[GL.BLEND_SRC_RGB]: GL.ONE,
      [GL.BLEND_DST_RGB]: GL.ONE,
      [GL.BLEND_EQUATION]: GL.FUNC_ADD,
      [GL.BLEND_DST_ALPHA]: GL.ONE,
      //[GL.BLEND_SRC_ALPHA]: GL.ONE,
    },
    // currentTime: this.props.sliders.time[1]
  } as unknown as MapboxLayerProps<unknown>);
}

// update currentTime rendering variable on deck trips layer
export function setAnimationTimeAbm(tripsLayer: DeckLayer<any>, time: number) {
  (tripsLayer as DeckLayer<any>).setProps({ currentTime: time });
}

export async function buildAggregationLayer(
  heatLayerData: AgentsClusteredForHeatmap,
  timeRange: AbmTimeRange
): Promise<DeckLayer<any>> {

  const heatLayerFormed = [];
  //preparing Data for HeatMap Layer
  Object.entries(heatLayerData).forEach(([key, _value]) => {
    const hour = parseInt(key)
    if (hour as number >= timeRange[0] && hour <= timeRange[1]) {
      Object.entries(heatLayerData[key].values).forEach(
        ([subKey, subValue]) => {
          const coordinate = {
            c: subKey.split(",").map(Number), // coordinate string to array 
            w: heatLayerData[key].values[subKey].length,  // values is an array of names of the active agents at that location
          };
          heatLayerFormed.push(coordinate);
        }
      );
    }
  });


  return new DeckLayer({
    id: abmAggregationLayerName,
    type: HeatmapLayer,
    data: heatLayerFormed,
    pickable: false,
    getPosition: (d) => d.c,
    getWeight: (d) => d.w,
    intensity: 20,
    threshold: 10,
    radiusPixels: 50,
    opacity: 0.8,
    visible: function () {
      return this.map.getZoom() < 17.5;
    },
  } as unknown as MapboxLayerProps<unknown>);
}
