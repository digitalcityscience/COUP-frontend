<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import { abmTripsLayerName, buildAggregationLayer } from '@/store/deck-layers'

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

        this.map.on('load', this.onMapLoaded)
        this.map.on('click', this.onMapClicked)
        this.map.on('contextmenu', this.onMapContextMenu)

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

            /**
             * @todo build UI component to change feature data
             */
            const newFeature = this.selectedFeatures[0]

            newFeature.properties.height = 100
            this.$store.dispatch('editFeatureProps', newFeature)
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
