import axios from "axios";
import type {
  StormWaterScenarioConfiguration,
  StormWaterResult,
  CalculationTask,
  MapSource,
  GeoJSON,
  WindResult,
} from "@/models";

/** Requests calculations and collects results for wind, noise or stormwater scenarios */
export default class ApiEndpoints {
  apiURL: string;
  endpointsCalculation: {
    wind: string;
    noise: string;
    stormWater: string;
  };
  endpointsResultCollection: {
    wind_single_task: string;
    wind_group_task: string;
    noise: string;
    stormWater: string;
  };

  constructor() {
    // base url api
    this.apiURL = process.env.VUE_APP_CALCULATIONS_API_URL;

    // endpoints to request calculation
    this.endpointsCalculation = {
      wind: this.apiURL + "wind/windtask",
      noise: this.apiURL + "noise/task",
      stormWater: this.apiURL + "water/task",
    };

    // endpoints for result collection
    this.endpointsResultCollection = {
      wind_single_task: this.apiURL + "wind/tasks/",
      wind_group_task: this.apiURL + "wind/grouptasks/",
      noise: this.apiURL + "noise/tasks/",
      stormWater: this.apiURL + "water/tasks/",
    };
  }
}

const config = new ApiEndpoints();

/** ************* */
/** Calculation Requests */
/** ************* */

// triggers wind calculation and returns the result uuids of the result
export async function requestCalculationWind(
  windScenario: GenericObject,
  cityPyoUserId: string
): Promise<CalculationTask> {
  console.debug(" requesting calc for windScenario", windScenario);
  return await requestCalculation(
    config.endpointsCalculation.wind,
    windScenario,
    cityPyoUserId
  );
}

// triggers noise calculation and returns the result uuids of the result
export async function requestCalculationNoise(
  noiseScenario: GenericObject,
  cityPyoUserId: string
) {
  console.log(" requesting calc for noiseScenario", noiseScenario);
  return await requestCalculation(
    config.endpointsCalculation.noise,
    noiseScenario,
    cityPyoUserId
  );
}

// triggers stormWater calculation and returns the result uuids of the result
export async function requestCalculationStormWater(
  stormWaterScenario: StormWaterScenarioConfiguration,
  cityPyoUserId: string
): Promise<unknown> {
  return await requestCalculation(
    config.endpointsCalculation.stormWater,
    stormWaterScenario,
    cityPyoUserId
  );
}

/** ************* */
/** RESULT GETTERS */
/** ************* */

/** gets wind result */
export async function getResultForWind({
  taskId,
}: CalculationTask): Promise<WindResult> {
  // first get result object for parent task -> returns a groupTask
  const groupTaskResult = await getResultWhenReady(
    config.endpointsResultCollection["wind_single_task"],
    taskId
  );

  // get results for tasks in groupTask
  const result = await getResultWhenReady(
    config.endpointsResultCollection.wind_group_task,
    groupTaskResult
  ).then((result) => {
    return result;
  });

  // check result validity
  if (!result["features"]) {
    console.error("Invalid result", result);
    throw new Error("Did not get a valid result");
  }

  return  {
    geojson: result
  };
}

/** gets noise result */
export async function getResultForNoise(task: GenericObject): Promise<GeoJSON> {
  // TODO make task object
  const result = await getResultWhenReady(
    config.endpointsResultCollection.noise,
    task["taskId"]
  );

  // check result validity
  if (!result["features"]) {
    console.error("Invalid result", result);
    throw new Error("Did not get a valid result");
  }

  return result
}

/** gets stormwater result */
export async function getResultForStormWater(
  task: GenericObject
): Promise<StormWaterResult> {
  // TODO make task object
  const result = await getResultWhenReady(
    config.endpointsResultCollection.stormWater,
    task["taskId"]
  );

  // check result validity
  if (!(result["geojson"] && result["rain"])) {
    console.error("Invalid result", result);
    throw new Error("Did not get a valid result");
  }

  return {
    geojson: result["geojson"], // geojson with subcatchments to be shown as map layer
    rainData: result["rain"], // rain data to be shown in time TimeSheet
  };
}

// triggers stormWater calculation and returns the result uuids of the result
async function requestCalculation(
  url: string,
  scenarioConfig: GenericObject,
  cityPyoUserId: string
) {
  let scenario = Object.assign({}, scenarioConfig);
  scenario["city_pyo_user"] = cityPyoUserId;
  scenario["result_format"] = "geojson"; // mapbox front-end always needs geojson results
  const result_uuid = await makePostRequest(url, scenario);

  return result_uuid;
}

/** polls the api for the result until ready */
async function getResultWhenReady(url, taskUuid) {
  const initialSleepTime = 1000;
  const maxTries = 120000 / initialSleepTime;
  
  let result_ready = false;

  return (async () => {
    const generator = getResultGenerator(0, maxTries, url, taskUuid, initialSleepTime);
    for await (const response of generator) {
      result_ready = response["resultReady"] || response["grouptaskProcessed"]  // TODO rename at endpoint
      if (result_ready) {
        return response["result"] || response["results"];  // "results" for group tasks 
      }
    }
    console.error("could not get result for url, uuid", url, taskUuid);
    throw new Error("Could not get result from server");
  })();
}

async function makePostRequest(requestUrl, scenario) {
  console.log("performing request with scneario ", scenario);

  const response = await axios
    .post(requestUrl, scenario)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error("Error when posting calculation request", error);
      throw new Error("Could not post calculation request");
    });

  return response;
}

async function makeGetRequest(requestUrl) {
  return await axios
    .get(requestUrl)
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error("Error when getting results", error, requestUrl);
      throw new Error("Could not load results from server");
    });
}

export function formatResultAsMapSource(id: string, responseJson): MapSource {
  return {
    id: id,
    options: {
      type: "geojson",
      data: responseJson,
    },
  };
}

async function* getResultGenerator(start, end, url, taskUuid, sleepTime) {
  for (let i = start; i <= end; i++) {
    await new Promise((resolve) => setTimeout(resolve, sleepTime));
    sleepTime = Math.max(sleepTime + 1000, 5000)
    yield await makeGetRequest(url + taskUuid);
  }
}
