<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import { abmTripsLayerName, buildAggregationLayer } from '@/store/deck-layers'
import amenities from '@/config/amenities.json'
import { alkisTranslations } from '@/store/abm'

export default {
    name: 'Map',
    computed: {
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'layers',
            'layerIds',
            'selectedFeatures'
        ]),
        heatMapData(){
            return this.$store.state.scenario.heatMapData;
        },
        heatMapActive(){
            return this.$store.state.scenario.heatMap;
        }
    },watch: {
        heatMapData(){
            this.updateHeatMap();
        },
        heatMapActive(){
            this.updateHeatMap();
        },
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

        // Create a popup, but don't add it to the map yet.
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        })

        this.map.on('load', this.onMapLoaded)
        this.map.on('click', this.onMapClicked)
        this.map.on('contextmenu', this.onMapContextMenu)
        this.map.on('mousemove', amenities.layer.id, this.onAmenitiesHover)
        this.map.on('mouseleave', amenities.layer.id, this.onAmenitiesHoverLeave)

        console.log(this.$store.state.map);
    },
    methods: {
        onMapClicked (evt) {
            const bbox = [
                [evt.point.x - 5, evt.point.y - 5],
                [evt.point.x + 5, evt.point.y + 5]
            ]

            console.log(evt.pageX);
            console.log(evt.pageY);

            const features = this.map.queryRenderedFeatures(bbox, {
                layers: this.layerIds
            })

            this.$store.commit('selectedFeatures', features)
            console.log(this.selectedFeatures)
        },
        onMapLoaded () {
            console.log("create design layers")
            console.log(this.$store.state.map);
            this.$store.dispatch('createDesignLayers')
        },
        onMapContextMenu (evt) {
            console.log('Contextmenu', evt)
        },
        updateHeatMap(){
            console.log("somethin has changed", this.heatMapActive);
                this.$store.dispatch('scenario/rebuildDeckLayer')
        },
        onAmenitiesHover (evt) {
            this.map.getCanvas().style.cursor = 'pointer'

            const coordinates = evt.features[0].geometry.coordinates.slice()
            const alkisId = evt.features[0].properties.GFK
            const description = alkisTranslations[alkisId] || alkisId

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(evt.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += evt.lngLat.lng > coordinates[0] ? 360 : -360
            }

            // Populate the popup and set its coordinates
            // based on the feature found.
            this.popup
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(this.map)
        },
        onAmenitiesHoverLeave (evt) {
            console.log('leaving layer')
            this.map.getCanvas().style.cursor = ''
            this.popup.remove()
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
