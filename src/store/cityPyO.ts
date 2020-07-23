export default class CityPyO {
    url: string;
    userid: string;

    constructor(userdata: {username: string, password: string}) {
        this.url = process.env.VUE_APP_CITYPYO_URL
        this.login(userdata)
    }

    async login (userdata: {username: string, password: string}) {
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
        }
        else {
            console.warn(res.status, res.statusText)
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

    if (res.status == 200) {
      const json = await res.json();

      return {
        id: layerId,
        options: {
          type: 'geojson',
          data: json
        }
      }
    } else {
      console.warn(res.status, res.statusText)
    }
  }

    async getLayer (id: string) {
      let requestUrl = this.url +  'getLayer'

      let body = {
        userid: this.userid,
        layer: id
      }

      return this.performRequest(id, requestUrl, body)
    }

    async getScenarioResultLayer (id: string | number, scenario: AbmScenario) {
      let requestUrl = this.url +  'getLayer/' + scenario.designScenario
      let body = {
        userid: this.userid,
        layer: id,
        result_properties: scenario.moduleSettings
      }

      return this.performRequest(id, requestUrl, body)
    }

    getLayerData(query: string) {

    }

    updateLayerData (query: string) {

    }
}
