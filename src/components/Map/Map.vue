<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import { abmTripsLayerName } from '@/store/deck-layers'

export default {
    name: 'Map',
    computed: {
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'layerIds',
            'selectedFeatures'
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
        //this.map.on('sourcedata', this.animateTripsLayer)
        this.map.on('contextmenu', this.onMapContextMenu)
    },
    methods: {
        onMapClicked (evt) {
            const bbox = [
                [evt.point.x - 5, evt.point.y - 5],
                [evt.point.x + 5, evt.point.y + 5]
            ]
            const features = this.map.queryRenderedFeatures(bbox, {
                layers: this.layerIds
            })

            this.$store.commit('selectedFeatures', features)
            console.log(this.selectedFeatures)

            /**
             * @todo build UI component to change feature data
             */
            const newFeature = this.selectedFeatures[0]

            newFeature.properties.height = 100
            this.$store.dispatch('editFeatureProps', newFeature)
        },
        onMapLoaded () {
            console.log("create design layers")
            this.$store.dispatch('createDesignLayers')
        },
        onMapContextMenu (evt) {
            console.log('Contextmenu', evt)
        },
        animateTripsLayer () {
            if (this.$store.state.map.getLayer(abmTripsLayerName)) {
                this.$store.dispatch('animateTripsLayer')
            }

            this.$store.dispatch('abm/myAction')
        }
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
