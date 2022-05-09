// Parse environment variables, which are set for the production docker container.

const envs = {
    MAPBOX_TOKEN: process.env.VUE_APP_MAPBOX_TOKEN,
    CITYPYO_URL: process.env.VUE_APP_CITYPYO_URL,
    CALCULATIONS_API_URL: process.env.VUE_APP_CALCULATIONS_API_URL,
    CALCULATIONS_API_USER: process.env.VUE_APP_CALCULATIONS_API_USER,
    CALCULATIONS_API_PW: process.env.VUE_APP_CALCULATIONS_API_PW,
}

export default envs;
