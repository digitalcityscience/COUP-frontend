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

        return responseJson
      }
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
