import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import * as Cesium from 'cesium/Build/Cesium/Cesium'

window.Cesium = Cesium;

Vue.config.productionTip = false

new Vue({
    name: 'Grasbrook',
    router,
    store,
    vuetify,
    render: h => h(App)
}).$mount('#app')
