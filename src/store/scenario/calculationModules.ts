// returns the result uuids of the result
export async function request_calculation(simType, scenario) {
  let url = ''
  scenario["result_format"] = "geojson"  // mapbox front-end always needs geojson results

  console.log("simtype", simType)
  console.log("scenaro", scenario)

  switch (simType) {
    case "wind":
      //url = 'http://wind-api:5000/windtask'
      url = 'http://localhost:5003/windtask'
      break;
    case "noise":
      // todo should not be triggered as group task
      //url = 'https://api.hcu-dev.de/noise/task'
      url = 'http://localhost:5001/task'
      break;
    case "stormwater":
      // todo should not be triggered as group task
      //url = 'http://swimdock-api:5000/grouptask'
      url = 'http://localhost:5002/grouptask'
      scenario = { "tasks": [scenario] }
      break;
    default:
      console.error("could not find calc url for simtype", simType)
      url = ''
  }

  console.log("requesting calculation")
  let result_uuid = await performRequest(url, scenario, "POST")
  return await result_uuid
}


/**
* fetch scenario result for the scenario
* This function will wait for the backend to provide a simulation result file as simType_SCENARIO_HASH.json
*
* If the result file cannot be found after trying for 10seconds the function throws an error and exits
*
* @param simType | e.g. wind or stormwater
* @param scenarioHash
*/
export async function getSimulationResultForScenario(simType, task_uuid) {
  let url = ''
  switch (simType) {
    case "wind":
      //url = 'https://wind-api:5000/windtask'  // TODO update url. ideally get from env variables.
      url = 'http://localhost:5003/tasks/'
      task_uuid = task_uuid["taskId"]
      break;
    case "noise":
      //url = 'http://noise-api:5000/grouptask'
      url = 'http://localhost:5001/tasks/'
      task_uuid = task_uuid["taskId"]
      break;
    case "stormwater":
      //url = 'http://swimdock-api:5000/grouptask'
      url = 'http://localhost:5002/grouptasks/'
      task_uuid = task_uuid["taskIds"][0] // // todo should not be triggered as group task
      break;
    default:
      console.error("could not get result for simtype", simType)
      return
  }

  let result = await getResultForTask(url, task_uuid)
  if (!result) {
    console.error("could not get a result for this task id", task_uuid)
    return {}
  }

  console.log("got this result for uuid", result, task_uuid)

  // for wind the result is the uuid of a sub-group-task - then collect these results and return them.
  if (simType == "wind" && result) {
    url = 'http://localhost:5003/grouptasks/'
    result = await getResultsForSubGroupTask(url, result).then(
      result => { return result }
    )

    return { "complete": result["complete"], "source": await formatResultAsMapSource(simType, await result["results"]) }
  }

  return { "complete": true, "source": await formatResultAsMapSource(simType, await result) }
}

async function getResultForTask(url, taskUuid) {
  const sleepTime = 2000
  const maxTries = 90000 / sleepTime  // give up after 90 seconds
  let requestCount = 0

  let task_succeeded = false
  while (!task_succeeded && requestCount < maxTries) {

    const response = await (await fetch(url + taskUuid)).json()
    task_succeeded = response['taskSucceeded']
    console.log("response, response['taskSucceeded']")
    console.log(response, response['taskSucceeded'])

    if (task_succeeded) {
      return response["result"]
    }

    // result not found yet. wait until result available.
    await new Promise(resolve => setTimeout(resolve, sleepTime)).then(() => {
      console.log("request count", requestCount)
      requestCount += 1
    });
  }

  console.error("could not get result for url, uuid", url, taskUuid)
  return null
}

// gets the results of a wind group task
async function getResultsForSubGroupTask(url, groupTaskUuid) {

  const response = await (await fetch(url + groupTaskUuid)).json()
  const resultsComplete = response['grouptaskProcessed']

  console.log("wind calculation has this many completed results ", response["tasksCompleted"])

  return {
    "results": await response["results"],
    "complete": await resultsComplete
  }
}


async function performRequest(requestUrl, scenario, method) {


  console.log("performing request with scneario ", scenario)

  const res = await fetch(requestUrl, {
    method: method,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(scenario)
  })

  if (res.status !== 200) {
    console.warn("could not get/update ressource from cityPyo ", scenario, res.status, res.statusText)
  }

  return await res.json()
}

async function formatResultAsMapSource(id, responseJson) {
  return {
    id: id,
    options: {
      type: 'geojson',
      data: await responseJson
    }
  }
}