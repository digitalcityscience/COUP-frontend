<script>
import Map from './components/Map/Map.vue'
import GFI from './components/GFI/GFI.vue'

export default {
    name: 'App',
    components: {
        Map,
        GFI
    },
    data: () => ({
        title: 'GRASBROOK FUNCTIONAL PLANNING'
    })
}
</script>

<template>
    <v-app>
        <Map />
        <GFI />

    <!-- <div id="nav">
      <router-link to="/">Home</router-link>
    </div> -->
    <!-- <router-view/> -->
    </v-app>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
