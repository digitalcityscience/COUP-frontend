import { workshopScenarioNames } from '@/store/abm.ts'
import Amenities from "@/config/amenities.json";

export default class CityPyO {
    url: string;
    userid: string;

    constructor() {
        this.url = process.env.VUE_APP_CITYPYO_URL
        //this.login(userdata)
    }

    async login (userdata: {username: string, password: string}) {
        // log login request on cityPyo only if in production
        userdata["log_this_request"] =  !(process.env.NODE_ENV === 'development')

        const res = await fetch(this.url + 'login', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userdata)
        })

        if (res.status === 200) {
            const json = await res.json()
            this.userid = json.user_id
            return {"authenticated": true, "restricted": json.restricted }
        }
        else {
            console.warn(res.status, res.statusText)
            return  {"authenticated": false}
        }
    }

   async isUserRestricted() {
     const res = await fetch(this.url + 'isRestrictedUser', {
       method: 'POST',
       mode: 'cors',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({"username" : this.userid})
     })

     if (res.status === 200) {
       const json = await res.json()
       return json.restricted
     }
     else {
       console.warn(res.status, res.statusText)
       return true
     }
   }

  async performRequest(layerId, requestUrl, body) {

    const res = await fetch(requestUrl, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (res.status !== 200) {
      console.warn("could not get ressource from cityPyo ", layerId, res.status, res.statusText)
    }

    return await res
  }

    async getLayer (id: string, formattedAsSource: boolean = true) {
      console.log("getting layer id from cityPyo", id)

      let requestUrl = this.url +  'getLayer'

      let body = {
        userid: this.userid,
        layer: id
      }

      const response = await this.performRequest(id, requestUrl, body)

      if (response.status == 200) {
        const responseJson = await response.json();

        if (formattedAsSource) {
          return this.formatResponse(id, responseJson)
        }

        return await responseJson
      }

      return await response.status
    }

    /**
     * @param fileName | without the .json ending
     * @param propPath | path to property that should be updated (inside the file)
     * @param payload | new value of the property to be updated
     */
    async addLayerData(fileName:string, propPath: Array<string>, payload) {
      let requestUrl = this.url + 'addLayerData/' + fileName

      for (let prop of propPath) {
        requestUrl += '/' + prop
      }

      const body = {
        "userid": this.userid,
        "data": payload
      }
      await this.performRequest(fileName, requestUrl, body)
    }

    async getAbmResultLayer (id: string, scenario: AbmScenario) {
      // fetch predefined workshop scenario layer
      if (workshopScenarioNames.includes(id)) {
        let responseJson = await this.getLayer(id, false)

        return this.formatResponse(id, responseJson.data)
      }

      // fetch abm scenario based on module settings and view filters
      let requestUrl = this.url +  'getLayer/' + "abmScenario"
      let body = {
        userid: this.userid,
        scenario_properties: scenario.moduleSettings,
        agent_filters: scenario.scenarioViewFilters
      }

      const response = await this.performRequest(id, requestUrl, body)
      if (response.status == 200) {
        const responseJson = await response.json();

        return this.formatResponse(id, responseJson.data)
      }
    }

  /**
   * fetch scenario result for the scenarioHash
   * This function will wait for the backend to provide a simulation result file as simType_SCENARIO_HASH.json
   *
   * If the result file cannot be found after trying for 10seconds the function throws an error and exits
   *
   * @param simType | e.g. wind or stormwater
   * @param scenarioHash
   */
  async getSimulationResultForScenario(simType, scenarioHash) {
    const sleepTime = 2000
    const maxTries = 90000 / sleepTime  // give up after 90 seconds
    let requestCount = 0
    let noResultReceived = true

    // try to get simulation result until maxTries is reached
    while (requestCount <= maxTries && noResultReceived) {
      let result;

      try {
        result = await this.getLayer(simType + "_" + scenarioHash, false)
      } catch (e) {
        console.log(e)
        result = null
      }

      // result has been found
      if (typeof result === 'object' && result !== null) {
        // return the result
        return {"complete": result["complete"], "source": await this.formatResponse(simType, result["results"]) }
      }

      // result has not been found. check if error code is expected for non-existent files
      if (typeof result === "number") {
        // unexpected error occurred
        if (!(result === 404 || 400)) {
          console.log("Still waiting on result for ", simType, " Hash, httpRespsone", scenarioHash, result)
        }
      }

      // result not found yet. wait until result available.
      await new Promise(resolve => setTimeout(resolve, sleepTime)).then(() => {
        console.log("request count", requestCount)
        requestCount += 1
      });
    }

    // too many tries. backend did not provide result file in reasonable time.
    console.error("Could not fetch result for ", simType, scenarioHash, "because of timeout")
    return
  }

  // the amenities layer is dependent on the chosen scenario
  async getAbmAmenitiesLayer (id: string, scenario: AbmScenario) {
      // fetch predefined workshop scenario layer
      if (workshopScenarioNames.includes(id)) {
        let responseJson = await this.getLayer("amenities_" + id)
        responseJson.id = Amenities.mapSource.data.id
        return responseJson
      }

      // else: fetch abmScenario file, including all scenarios from CityPyo
      let query = scenario.moduleSettings.main_street_orientation + "_" + scenario.moduleSettings.roof_amenities

      let requestUrl = this.url +  'getLayer/' + query
      let body = {
        userid: this.userid,
        layer: id,
      }
      const response = await this.performRequest(id, requestUrl, body)
      if (response.status == 200) {
        const responseJson = await response.json();

        return this.formatResponse(id, responseJson.data)
      }
    }

    async combineLayers(layer1, layer2) {
      let requestUrl = this.url + 'combineLayers'

      const body = {
        "userid": this.userid,
        "layer_1": layer1,
        "layer_2": layer2
      }
      const response = await this.performRequest('', requestUrl, body)

      if (response.status === 200) {
        const responseJson = await response.json()
        return await responseJson
      } else {
        return null
      }
    }


    getLayerData(query: string) {
    }

    updateLayerData (query: string) {

    }

  async formatResponse(id, responseJson) {
    return {
      id: id,
      options: {
        type: 'geojson',
        data: await responseJson
      }
    }
  }
}
