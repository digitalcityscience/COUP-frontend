<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import { abmTripsLayerName, buildAggregationLayer } from '@/store/deck-layers'
import amenities from '@/config/amenities.json'
import { alkisTranslations } from '@/store/abm'
import {generateStoreGetterSetter} from "@/store/utils/generators";
import Contextmenu from "@/components/Menu/Contextmenu.vue";
import {calculateAbmStatsForFocusArea} from "@/store/scenario/abmStats";

export default {
    name: 'Map',
    components:{ Contextmenu },
    data() {
        return {
            lastClicked: [],
            featuresObject: {},
            targetFound: false,
            featureFound: false,
            hoveredFocusArea: null,
            selectedFocusArea: null
        }
    },
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
        ...generateStoreGetterSetter([
            ['allFeaturesHighlighted', 'allFeaturesHighlighted' ],
            ['showLegend', 'showLegend' ]
        ]),
        heatMapData(){
            return this.$store.state.scenario.heatMapData;
        },
        heatMapActive(){
            return this.$store.state.scenario.heatMap;
        },
        heatMapType(){
            return this.$store.state.scenario.heatMapType;
        },
        workshop(){
            return this.$store.state.workshop;
        },
        selectedFeatures(){
            return this.$store.state.selectedFeatures;
        }
    },watch: {
        heatMapData(){
            this.updateHeatMap();
        },
        heatMapActive(){
            this.updateHeatMap();
        },
        heatMapType(){
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

        // general map interaction
        this.map.on('load', this.onMapLoaded)
        this.map.on('click', this.onMapClicked)
        this.map.on('contextmenu', this.onMapContextMenu)

        // amenties layer
        this.map.on('mousemove', amenities.layer.id, this.onAmenitiesHover)
        this.map.on('mouseleave', amenities.layer.id, this.onAmenitiesHoverLeave)

        // focus areas layer
        this.map.on('mousemove', 'focusAreas', this.onFocusAreaHover)
        this.map.on('mouseleave', 'focusAreas', this.onFocusAreaLeave)
        this.map.on('click', 'focusAreas', this.onFocusAreaClick)

        //console.log(this.$store.state.map);
    },
    methods: {
        mousePos(evt){
                this.lastClicked = [];
                this.lastClicked[0] = ((evt.clientX * 100)/window.innerWidth)/100;
                this.lastClicked[1] = ((evt.clientY * 100)/window.innerHeight)/100;
                this.$store.commit('scenario/lastClick', this.lastClicked);

                if(this.targetFound){this.openContextMenu();}
        },
        onMapClicked (evt) {
            if(!this.workshop){
                this.targetFound = false;
                const bbox = [
                    [evt.point.x - 10, evt.point.y - 10],
                    [evt.point.x + 10, evt.point.y + 10]
                ]

                const features = this.map.queryRenderedFeatures(bbox, {
                    layers: this.layerIds,
                });

                const singleOutTarget = [];
                features.forEach((feature,i,a) => {
                    const initialFeature = a[0].properties.building_id;
                    let specialFeature = feature.properties.building_id;
                    if(specialFeature == initialFeature) {
                        singleOutTarget.push(feature);
                    }
                });

                this.$store.commit('selectedFeatures', singleOutTarget);

                if(singleOutTarget === undefined || singleOutTarget.length == 0){
                    console.log("no feature selected");
                    this.targetFound = false;
                } else {
                    const building = singleOutTarget[0].properties.area_planning_type;
                    if(building == "building"){
                        const newFeature = this.selectedFeatures;
                        newFeature.forEach(feature => {
                            if(feature.properties.selected != 'active'){
                                feature.properties.selected = "active";
                                this.featureFound = true;
                                this.$store.dispatch('editFeatureProps', feature);
                            } else {
                                if(!this.allFeaturesHighlighted){
                                    feature.properties.selected = "inactive";
                                    this.featureFound = false;
                                    this.$store.dispatch('editFeatureProps', feature);
                                } else {
                                    feature.properties.selected = "active";
                                    this.featureFound = true;
                                    this.$store.dispatch('editFeatureProps', feature);
                                }
                            }
                        });
                        //newFeature.properties.selected = "active";
                        this.targetFound = true;

                    } else {
                        this.targetFound = false;
                    }
                }
            } else {
                console.log("Feature not available in workshop mode");
                this.map.setLayoutProperty('upperfloor', 'visibility', 'none');
            }
        },
        onMapLoaded () {
            console.log("create design layers")
            //console.log(this.$store.state.map);
            this.$store.dispatch('createDesignLayers').then(() => {
                this.$store.dispatch('orderDesignLayers').then(() => {
                    if(this.workshop){
                        this.map.setLayoutProperty('upperfloor', 'visibility', 'none');
                    }
                });
            })
        },
        onMapContextMenu (evt) {
            if(this.allFeaturesHighlighted){
                this.targetFound = false;
                const bbox = [
                    [evt.point.x - 10, evt.point.y - 10],
                    [evt.point.x + 10, evt.point.y + 10]
                ]

                const features = this.map.queryRenderedFeatures(bbox, {
                    layers: this.layerIds,
                });

                const singleOutTarget = [];
                features.forEach((feature,i,a) => {
                    const initialFeature = a[0].properties.building_id;
                    let specialFeature = feature.properties.building_id;
                    if(specialFeature == initialFeature) {
                        singleOutTarget.push(feature);
                    }
                });

                this.$store.commit('selectedFeatures', singleOutTarget);

                if(singleOutTarget === undefined || singleOutTarget.length == 0){
                    console.log("no feature selected");
                    this.targetFound = false;
                } else {
                    const building = singleOutTarget[0].properties.area_planning_type;
                    if(building == "building"){
                        const newFeature = this.selectedFeatures;
                        newFeature.forEach(feature => {
                            if(feature.properties.selected != 'active'){

                            } else {
                                if(this.allFeaturesHighlighted){
                                    feature.properties.selected = "inactive";
                                    this.featureFound = false;
                                    this.$store.dispatch('editFeatureProps', feature);
                                }
                            }
                        });

                        const targetId = newFeature[0].properties.building_id;
                        this.$modal.hide(targetId);
                        //newFeature.properties.selected = "active";
                        this.targetFound = true;

                    } else {
                        this.targetFound = false;
                    }
                }
            }
        },
        openContextMenu(features){
            this.featuresObject = {click: this.lastClicked};
            console.log(this.selectedFeatures);
            let modal_id = this.selectedFeatures[0].properties.building_id;
            if(this.featureFound){
                this.$modal.show(
                    Contextmenu,
                    {},
                    {name: modal_id, draggable: window.innerWidth >= 1024 ? true : false, width:280, adaptive: true, shiftX: this.lastClicked[0] + 0.125, shiftY: this.lastClicked[1] + 0.125}
                )
            } else {
                this.$modal.hide(modal_id);
            }
        },
        updateHeatMap(){
                //this.$store.dispatch('scenario/rebuildDeckLayer')
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
        },
        onFocusAreaHover (evt) {
          if (evt.features.length > 0) {
            if (this.hoveredFocusArea) {
              this.map.setFeatureState(
                { source: 'focusAreas', id: this.hoveredFocusArea },
                { hover: false }
              )
            }
            this.hoveredFocusArea = evt.features[0].id

            this.map.setFeatureState(
              { source: 'focusAreas', id: this.hoveredFocusArea },
              { hover: true }
            )
          }
        },
        onFocusAreaLeave (evt) {
          if (this.hoveredFocusArea) {
            this.map.setFeatureState(
              { source: 'focusAreas', id: this.hoveredFocusArea },
              { hover: false }
            )
          }
          this.hoveredFocusArea = null
        },
        onFocusAreaClick (evt) {
          // TODO set color!

          console.log("click!", evt.features)
          if (evt.features.length > 0) {
            this.selectedFocusArea = evt.features[0].id

            console.log("selected focus area", this.selectedFocusArea)

            // compute results.
            calculateAbmStatsForFocusArea(this.selectedFocusArea)
          }
        },
    }
}
</script>

<template>
    <div @click="mousePos" id="map" ref="map">
    </div>
</template>

<style scoped lang="scss">
    #map {
        height: 100%;
        width: 100%;
    }
</style>
