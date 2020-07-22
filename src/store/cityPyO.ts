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

    async getLayer (id: string | number, scenario?: string, resultProperties?: string[]) {
      let requestUrl = this.url +  'getLayer'
      if (scenario) {
        requestUrl = requestUrl + '/' + scenario
      }
      let body = {
        userid: this.userid,
        layer: id
      }
      if (resultProperties) {
        body["result_properties"] = resultProperties
      }
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

          if (scenario) {
            console.log("got this scenarios data from cityPyo")
            console.log(json)
          }

          return {
            id,
            options: {
              type: 'geojson',
              data: json
            }
          }
        } else {
          console.warn(res.status, res.statusText)
      }
    }

    getLayerData(query: string) {

    }

    updateLayerData (query: string) {

    }
}
