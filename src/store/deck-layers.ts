import { Layer as MapboxLayer } from 'mapbox-gl'
import {MapboxLayer as DeckLayer} from "@deck.gl/mapbox";
import {TripsLayer} from "@deck.gl/geo-layers";
import {ActionContext} from "vuex";

export const abmTripsLayerName = "abmTrips"
export const verticalPathLayout = 'pathVertical'
export const horizontalPathLayout = 'pathHorizontal'

export function getBridgeLayer(state: StoreState): MapboxLayer  {
  let layer = state.map.getLayer("bridges")
  let scenarioName = getScenarioName(state.abmScenario)

  if (scenarioName != 'bridge1_bridge2') {
    layer.filter = ["==", "bridge", getScenarioName(state.abmScenario)]
  }

  return layer
}

export async function buildTripsLayer(state: StoreState): DeckLayer {
  const requestScenario = getScenarioName(state.abmScenario)
  const scenarioProperties = getScenarioProperties(state.abmScenario)

  return state.cityPyO.getLayer(abmTripsLayerName, requestScenario, scenarioProperties)
    .then(result => {
      console.log("result from cityPyo")
      console.log(result)

      let deckLayer = new DeckLayer({
        id: abmTripsLayerName,
        type: TripsLayer,
        data: result.options.data.data.abm,
        getPath: (d) => d.path,
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
      console.log(deckLayer)
      console.log("adding this layer", deckLayer)
      // state.map?.addLayer(deckLayer)
      return deckLayer
  })
}

export function getScenarioName(scenario: AbmScenario): string {
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
export async function animate(layer: MapboxLayer, start: number =null, end: number =null) {
  console.log("animating layer")
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
  return Math.min(...layer.implementation.props.data.map((d: any) => Math.min(...layer.implementation.props.getTimestamps(d))));
}

function getLayerEndTime(layer: MapboxLayer) {
  return Math.max(...layer.implementation.props.data.map((d: any) => Math.max(...layer.implementation.props.getTimestamps(d))));
}

