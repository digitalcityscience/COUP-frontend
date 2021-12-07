import type { StormWaterScenarioConfiguration, StormWaterResult } from "@/models";


/** Requests calculations and collects results for wind, noise or stormwater scenarios */
export default class CalculationModules {
  cityPyoUser: string;
  apiURL: string;
  endpointsCalculation: GenericObject
  endpointsResultCollection: GenericObject

  constructor(cityPyoUser: string) {
    this.cityPyoUser = cityPyoUser;
    
    // base url api
    this.apiURL = process.env.VUE_APP_CALCULATIONS_API_URL;
    
    // endpoints to request calculation
    this.endpointsCalculation = {
      "wind": this.apiURL +  "wind/windtask",
      "noise": this.apiURL + "noise/task",
      //"stormWater": this.apiURL + "water/task",
      "stormWater": "http://localhost:5002" + "/task",
    }

    // endpoints for result collection
    this.endpointsResultCollection = {
      "wind_single_task": this.apiURL +  "wind/tasks/",
      "wind_group_task": this.apiURL +  "wind/grouptasks/",
      "noise": this.apiURL + "noise/tasks/",
      // "stormWater": this.apiURL + "water/tasks/",
      "stormWater":  "http://localhost:5002" + "/tasks/",
    }
  }


  /** ************* */
  /** Calculation Requests */
  /** ************* */

   // triggers wind calculation and returns the result uuids of the result
  async requestCalculationWind(windScenario: GenericObject) {
    console.log(" requesting calc for windScenario", windScenario);
    return await requestCalculation(this.endpointsCalculation["wind"], windScenario, this.cityPyoUser);
  }
  
  // triggers noise calculation and returns the result uuids of the result
  async requestCalculationNoise(noiseScenario: GenericObject) {
    console.log(" requesting calc for noiseScenario", noiseScenario);
    return await requestCalculation(this.endpointsCalculation["noise"], noiseScenario, this.cityPyoUser);
  }
  
  // triggers stormWater calculation and returns the result uuids of the result
  async requestCalculationStormWater(stormWaterScenario: StormWaterScenarioConfiguration) {
    return await requestCalculation(this.endpointsCalculation["stormWater"], stormWaterScenario, this.cityPyoUser);
  }


  /** ************* */
  /** RESULT GETTERS */
  /** ************* */
  
  /** gets wind result */
  async getResultForWind(task: GenericObject) { // TODO make groupTask object
    
    // first get result for parent task -> returns a groupTask
    let task_uuid = task["taskId"];
    let groupTask = await getResultForSingleTask(this.endpointsResultCollection["wind_single_task"], task_uuid);
    
    // early return
    if (!groupTask) {
      return {}
    }

    // get results for tasks in groupTask
    let result = await getResultsForWindGroupTask(
      this.endpointsResultCollection["wind_group_task"],
      groupTask
      ).then((result) => {
        return result
    })

    // check result validity
    if (! await result["results"] ) {
      console.error("Invalid result", await result)
      throw new Error("Did not get a valid result")
    }

    return {
      complete: result["complete"],  //  indicator whether all result tiles have beeen received.
      source: await formatResultAsMapSource("wind", await result["results"]),
    };

  }
  
  /** gets noise result */
  async getResultForNoise(task: GenericObject) { // TODO make task object
    let result = await getResultForSingleTask(this.endpointsResultCollection["noise"], task["taskId"])
    

    // check result validity
    if (! await result) {
      console.error("Invalid result", await result)
      throw new Error("Did not get a valid result")
    }

    return {
      complete: true, // noise result does not come in parts
      source: await formatResultAsMapSource("noise", await result),
    };
  }

  /** gets stormwater result */
  async getResultForStormWater(task: GenericObject): Promise<StormWaterResult> { // TODO make task object
    let result = await getResultForSingleTask(this.endpointsResultCollection["stormWater"], task["taskId"])

    // check result validity
    if (!(await result["geojson"] && await result["rain"])) {
      console.error("Invalid result", await result)
      throw new Error("Did not get a valid result")
    }

    return {
      "complete": true, // stormwater result does not come in parts
      "geojson": await result["geojson"],  // geojson with subcatchments to be shown as map layer
      "rainData": await result["rain"] // rain data to be shown in time TimeSheet
    };
  }
}

// triggers stormWater calculation and returns the result uuids of the result
async function requestCalculation(url: string, scenario: GenericObject, cityPyoUser:string) {
  scenario["city_pyo_user"] = cityPyoUser;
  scenario["result_format"] = "geojson"; // mapbox front-end always needs geojson results
  const result_uuid = await performRequest(url, scenario, "POST");
  
  return await result_uuid;
}
  
/** gets a result for a task. Retries to get a result until timeout */
async function getResultForSingleTask(url, taskUuid) {
  const sleepTime = 5000;
  const maxTries = 120000 / sleepTime; // give up after 2 min
  let requestCount = 0;

  let task_succeeded = false;
  while (!task_succeeded && requestCount < maxTries) {
    const response = await (await fetch(url + taskUuid)).json();
    task_succeeded = response["taskSucceeded"];
    console.log("response, response['taskSucceeded']");
    console.log(response, response["taskSucceeded"]);

    if (task_succeeded) {
      return response["result"];
    }

    // result not found yet. wait until result available.
    await new Promise((resolve) => setTimeout(resolve, sleepTime)).then(() => {
      console.log("request count", requestCount);
      requestCount += 1;
    });
  }

  console.error("could not get result for url, uuid", url, taskUuid)
  throw new Error("Could not get result from server")
}

/** gets the results of a wind group task */
async function getResultsForWindGroupTask(url, groupTaskUuid) {
  const response = await (await fetch(url + groupTaskUuid)).json();
  const resultsComplete = response["grouptaskProcessed"];

  console.log(
    "wind calculation has this many completed results ",
    response["tasksCompleted"]
  );

  return {
    results: await response["results"],
    complete: await resultsComplete,
  };
}

async function performRequest(requestUrl, scenario, method) {
  console.log("performing request with scneario ", scenario);

  const res = await fetch(requestUrl, {
    method: method,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(scenario),
  });

  if (res.status !== 200) {
    console.warn("could not get/update ressource from cityPyo ", scenario, res.status, res.statusText)
    throw new Error("Calculation request failed, " +  res.status)
  }

  return await res.json();
}

async function formatResultAsMapSource(id, responseJson) {
  return {
    id: id,
    options: {
      type: "geojson",
      data: await responseJson,
    },
  };
}
