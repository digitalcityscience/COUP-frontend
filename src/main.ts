import Vue from 'vue'
import Home from './Home.vue'
//import Login from './components/Login/Login.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import '@/style.main.scss'

Vue.config.productionTip = false

new Vue({
    name: 'Grasbrook Functionalscope',
    router,
    store,
    vuetify,
    render: h => h(Home)
}).$mount('#app')
