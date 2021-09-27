import store from "@/store";
import * as turf from "@turf/turf";

/**
 * Filters the original dataset according to request
 * Scales all values onto a range of 0-100, to make comparible in front-end
 *
 * @param request
 */
export function filterAndScaleLayerData(request: LayerAnalysisRequest) {
  console.warn(" filter and scale data layerName, Range", request);

  const layerData = createLayerData(request.layerName);
  const constraints = request.layerConstraints;
  const range = request.layerRange;

  layerData.features = layerData.features.filter((feature) => {
    return (
      constraints[0] <= feature.properties.value &&
      feature.properties.value <= constraints[1]
    );
  });

  turf.featureEach(layerData, function (feature) {
    const value = feature.properties.value;
    feature.properties["scaledValue"] =
      ((value - range[0]) / (range[1] - range[0])) * 100;
  });

  console.log("layerdata", layerData);

  return layerData;
}

/**
 * @param layer_1
 * @param layer_2
 */
export function showMultiLayerAnalysis(layer_1, layer_2, logicOperator) {
  return store.state.cityPyO
    .combineLayers(layer_1, layer_2)
    .then((combinedGeoJson) => {
      if (!combinedGeoJson) {
        return null;
      }

      const combinedLayerFeatures = combinedGeoJson["features"];
      store.dispatch(
        "scenario/addMultiLayerAnalysisLayer",
        combinedLayerFeatures
      );
      const performanceInfos = createPerformanceInfos(combinedLayerFeatures);
      store.dispatch(
        "scenario/addMultiLayerPerformanceInfos",
        performanceInfos
      );

      return combinedLayerFeatures;
    });
}

/**
 * Creates a feature collection for the selected index
 *
 * @param layerName
 */
function createLayerData(
  layerName: string
): turf.FeatureCollection<turf.Polygon | turf.MultiPolygon> {
  const baseDataSet = layerLookup(layerName);

  /** get layer data from geojson layers*/
  if (baseDataSet["type"] === "FeatureCollection") {
    // map properties to standard featureCollection for multiLayerAnalysis
    baseDataSet["features"].forEach((feature, featureId) => {
      if (layerName === "noise") {
        feature.properties["value"] = noiseLookup[feature.properties["idiso"]];
      } else {
        // wind and sun result value has key "value"
      }
      feature.properties["layerName"] = layerName;
      feature.properties["id"] = featureId;
    });

    return turf.featureCollection(baseDataSet["features"]);
  } else {
    /** get layer data from abmStats or amenityStats*/
    // create featureCollection with focusAreas polygons and selected value
    const layerData = [];
    for (const [focusAreaId, values] of Object.entries(baseDataSet)) {
      if (isNaN(parseInt(focusAreaId))) {
        continue;
      }
      const feature = getGeometryForFocusArea(focusAreaId);
      // TODO refactor structure of abm results
      feature.properties = { value: values[layerName] };
      feature.properties["layerName"] = layerName;
      feature.properties["id"] = focusAreaId;
      layerData.push(feature);
    }

    return turf.featureCollection(layerData);
  }
}

function createPerformanceInfos(combinedFeatures: turf.Feature[]) {
  const infos = [];
  combinedFeatures.forEach((feat) => {
    const lowOrHigh_1 = isLowOrHighValue(feat.properties.scaledValue_1);
    const lowOrHigh_2 = isLowOrHighValue(feat.properties.scaledValue_2);

    if (lowOrHigh_1 && lowOrHigh_2) {
      const info = turf.centroid(feat, {
        shortInfoText:
          feat.properties.layerName_1 +
          " level: " +
          lowOrHigh_1 +
          " \n" +
          feat.properties.layerName_2 +
          " level: " +
          lowOrHigh_2,
        infoText:
          "This area has a " +
          lowOrHigh_1 +
          " " +
          feat.properties.layerName_1 +
          " level " +
          "combined with a " +
          lowOrHigh_2 +
          " " +
          feat.properties.layerName_2 +
          " level",
      });
      infos.push(info);
    }
  });

  return infos;
}

/**
 * TODO - statistical high/lows
 *
 * Returns "high" , "low" or null , depending on the scaled value (always scaled to 0-100)
 * @param props
 */
function isLowOrHighValue(scaledValue): string | null {
  if (scaledValue >= 64) {
    return "high";
  }
  if (scaledValue <= 20) {
    return "low";
  }

  return null;
}

/**
 * iterate over unfiltered features
 * and keep all features that are not in the layerToInvert
 * @param layerToInvert
 */
function invertLayerFilter(layerToInvert) {
  const layerName = layerToInvert.features[0].properties.layerName;
  const unfilteredData = createLayerData(layerName);
  const invertedData = [];

  // iterate over unfiltered features and keep all features that are not in the layerToInvert
  unfilteredData.features.forEach((unfilteredFeature) => {
    if (
      !layerToInvert.features.some((featureToIgnore) => {
        return (
          featureToIgnore.properties.id === unfilteredFeature.properties.id
        );
      })
    ) {
      invertedData.push(unfilteredFeature);
    }
  });

  return turf.featureCollection(invertedData);
}

/**
 * Returns a MultiPolygon or Polygon that represents the Geometry of the focus area
 * @param focusAreaId
 */
function getGeometryForFocusArea(
  focusAreaId
): turf.Feature<turf.Polygon> | turf.Feature<turf.MultiPolygon> {
  const focusAreas = turf.featureCollection(
    store.state.focusAreasGeoJson["features"]
  ) as turf.FeatureCollection<turf.Polygon>;
  const polygons = focusAreas.features.filter((feature) => {
    return feature.id == focusAreaId;
  });

  console.log("polygons for focus area", focusAreaId, polygons);

  if (polygons.length === 1) {
    return turf.feature(polygons[0].geometry, {});
  }

  return turf.multiPolygon(
    polygons.map((polygon) => {
      return polygon.geometry.coordinates;
    })
  );
}

/**
 * Flattens all MultiPolygons in a feature Collection to an array of normal polygons
 * Returns an array of all polygons in feature collection
 *
 * @param featureCollection
 */
function flattenFeatureCollection(featureCollection) {
  const flattenedFeatures = [];
  featureCollection.features.forEach((feature) => {
    if (feature.geometry.type == "MultiPolygon") {
      turf.flatten(feature).features.forEach((flatFeat) => {
        flattenedFeatures.push(flatFeat);
      });
    } else {
      flattenedFeatures.push(feature);
    }
  });

  return flattenedFeatures;
}

const noiseLookup = [45, 50, 55, 60, 65, 70, 75, 80];

/**
 * return dataset for layer
 * @param layerName
 */
function layerLookup(layerName: string) {
  switch (layerName) {
    case "wind":
      return store.state.scenario.windResultGeoJson;
    case "sun":
      return store.state.scenario.sunExposureGeoJson;
    case "noise":
      return store.state.scenario.currentNoiseGeoJson;
    case "Density":
    case "Amenity Types":
      return store.state.scenario.amenityStatsMultiLayer;
    case "pedestrianDensity":
      return store.state.scenario.abmStatsMultiLayer;
    default:
      console.warn(
        "could not find baseDataSet for layerName",
        layerName,
        "in multiLayerAnalysis"
      );
      break;
  }
}
