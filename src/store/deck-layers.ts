import {MapboxLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";

export const abmTripsLayerName = "abmTrips"
export const verticalPathLayout = 'pathVertical'
export const horizontalPathLayout = 'pathHorizontal'


export function  buildTripsLayer(state: StoreState): MapboxLayer {
  const requestScenario = getRequestScenarioName(state.abmScenario)
  const scenarioProperties = getScenarioProperties(state.abmScenario)

  return new MapboxLayer({
      id: abmTripsLayerName,
      type: TripsLayer,
      data: state.cityPyO.getLayer(abmTripsLayerName, requestScenario, scenarioProperties),
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

function getRequestScenarioName(scenario: AbmScenario): string {
  if (scenario.bridge1 && scenario.bridge2) {
    return 'bridge1_bridge2'
  }
  if (scenario.bridge1) {
    return 'bridge1'
  }
  if (scenario.bridge2) {
    return 'bridge2'
  }
}

function getScenarioProperties(scenario: AbmScenario): string[] {
  const pathParam = scenario.pathLayout
  const buildingsOpen = scenario.walkTroughBuildings ? 'buildingsOpen' : 'buildingsClosed'

  return [pathParam, buildingsOpen]
}


// animate deck trips layer
export function animate(layer: MapboxLayer, start: number =null, end: number =null) {
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
  if (time >= end) {
    time = start
  }

  // update current time on layer to move the dot
  (layer as MapboxLayer).implementation.setProps({currentTime: time})

  // as long as endTime of trips layer is not reached - call next frame iteration
  if (time <= end) {
    window.requestAnimationFrame(() => {
      animate(layer, start, end);
    });
  }
}

function getLayerStartTime(layer: MapboxLayer) {
  console.log("deck layer", layer)
  return Math.min(...layer.implementation.props.data.map((d: any) => Math.min(...layer.implementation.props.getTimestamps(d))));
}

function getLayerEndTime(layer: MapboxLayer) {
  return Math.max(...layer.implementation.props.data.map((d: any) => Math.max(...layer.implementation.props.getTimestamps(d))));
}

