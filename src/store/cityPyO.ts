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

    async getLayer (id: string | number) {
        const res = await fetch(this.url + 'getLayer', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid: this.userid,
                layer: id
            })
        })

        if (res.status === 200) {
            const json = await res.json();

            return {
                id,
                options: {
                    type: 'geojson',
                    data: json
                }
            }
        }

        return console.warn(res.status, res.statusText)
    }

    getLayerData(query: string) {

    }

    updateLayerData (query: string) {

    }
}