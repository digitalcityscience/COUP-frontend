<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions } from 'vuex'
// import groundfloor from '@/assets/groundfloor.json'

export default {
    name: 'Map',
    data () {
        return {
        }
    },
    computed: {
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'layers'
        ])
    },
    mounted () {
        mapboxgl.accessToken = this.accessToken

        const options = {
            container: 'map',
            center: this.view.center,
            zoom: this.view.zoom,
            bearing: this.view.bearing,
            pitch: this.view.pitch,
            style: this.mapStyle,
        }

        this.$store.state.map = new mapboxgl.Map(options)

        this.map.on('load', this.onMapLoaded)
        this.map.on('click', this.onMapClicked)
    },
    methods: {
        onMapClicked (evt) {
            console.log(evt)
        },
        onMapLoaded (evt) {
            this.$store.dispatch('fetchLayerData')
        },
    }
}
</script>

<template>
    <div
        id="map"
        ref="map"
    />
</template>

<style scoped lang="scss">
    #map {
        height: 100%;
        width: 100%;
    }
</style>