<script>
import Map from './components/Map/Map.vue'
import GFI from './components/GFI/GFI.vue'
import { mapGetters } from 'vuex'

export default {
    name: 'App',
    components: {
        Map,
        GFI
    },
    computed: {
        ...mapGetters([
            'userid'
        ])
    },
    watch: {
        userid () {
            this.$store.dispatch('getLayer', 'groundfloor')
        }
    },
    created () {
        this.$store.dispatch('login', {
            username: 'ernie',
            password: 'bert'
        })
    }
}
</script>

<template>
    <v-app>
        <Map />
        <GFI />
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
</style>
