import { ActionContext } from 'vuex';

const url = process.env.VUE_APP_CITYPYO_URL

export default {
    async login (ctx: ActionContext<StoreState, StoreState>, userdata: {username: string, password: string}) {
        const res = await fetch(url + 'login', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userdata)
        })

        if (res.status === 200) {
            const json = await res.json()

            return ctx.commit('userid', json.user_id);
        }
        
        return console.warn(res.status, res.statusText)
    },
    async getLayer (ctx: ActionContext<StoreState, StoreState>, id: string | number) {
        if (! ctx.state.userid) {
            console.warn('You are not logged in. Please login. //TODO: fwd to login');
            return;
        }
        const res = await fetch(url + 'getLayer', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid: ctx.state.userid,
                layer: id
            })
        })

        if (res.status === 200) {
            const json = await res.json();

            return ctx.commit('addLayer', {
                id,
                type: 'geojson',
                data: json
            });
        }

        return console.warn(res.status, res.statusText)
    },
    getLayerData(ctx: ActionContext<StoreState, StoreState>, query: string) {

    },
    updateLayerData (ctx: ActionContext<StoreState, StoreState>, query: string) {

    }
}