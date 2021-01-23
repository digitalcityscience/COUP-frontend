<script lang="ts">
import mapboxgl from 'mapbox-gl'
import { mapState, mapActions, mapGetters, mapMutations } from 'vuex'
import amenities from '@/config/amenities.json'
import { alkisTranslations } from '@/store/abm'
import {generateStoreGetterSetter} from "@/store/utils/generators";
import Contextmenu from "@/components/Menu/Contextmenu.vue";
import {calculateAbmStatsForFocusArea} from "@/store/scenario/abmStats";
import {calculateAmenityStatsForFocusArea} from "@/store/scenario/amenityStats";
import FocusAreasLayer from "@/config/focusAreas.json";
import * as turf from '@turf/turf'


export default {
    name: 'Map',
    components:{ Contextmenu },
    data() {
        return {
            lastClicked: [],
            targetFound: false,
            showModal: false, // TODO remove
            hoveredFocusArea: null,
            modalLayers: ["groundfloor", "upperfloor", "rooftops", "amenities"]
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
        ]),
        ...generateStoreGetterSetter([
            ['allFeaturesHighlighted', 'allFeaturesHighlighted' ],
            ['selectedObjectId', 'selectedObjectId'],
            ['showLegend', 'showLegend' ],
            ['loader', 'scenario/loader' ],
            ['selectedFocusAreas', 'scenario/selectedFocusAreas' ],
            ['updateAbmStatsChart', 'scenario/updateAbmStatsChart'],
            ['updateAmenityStatsChart', 'scenario/updateAmenityStatsChart'],
            ['openModalsIds', 'openModalsIds'],
        ]),
        abmTrips(){
            return this.$store.state.scenario.abmTrips;
        },
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

        // amenities layer
        this.map.on('mousemove', amenities.layer.id, this.onAmenitiesHover)
        this.map.on('mouseleave', amenities.layer.id, this.onAmenitiesHoverLeave)

        // focus areas layer
        this.map.on('mousemove', 'focusAreas', this.onFocusAreaHover)
        this.map.on('mouseleave', 'focusAreas', this.onFocusAreaLeave)
    },
    methods: {
        mousePos(evt){
                this.lastClicked = [];
                this.lastClicked[0] = ((evt.clientX * 100)/window.innerWidth)/100;
                this.lastClicked[1] = ((evt.clientY * 100)/window.innerHeight)/100;
                this.$store.commit('scenario/lastClick', this.lastClicked);

                console.log("i hope this wasnt a mistake")
                // if(this.targetFound){this.createModal();}
        },
        onMapClicked (evt) {
          console.log("click!")
          console.log(evt)

          if (this.workshop) {
            console.log("Feature not available in workshop mode");
            this.map.setLayoutProperty('upperfloor', 'visibility', 'none');
            return
          }

          this.targetFound = false;
          const bbox = [
              [evt.point.x - 10, evt.point.y - 10],
              [evt.point.x + 10, evt.point.y + 10]
          ]

          const features = this.map.queryRenderedFeatures(bbox, {
              layers: this.layerIds,
          });
          this.actionForClick(features)
        },
        actionForClick(clickedFeatures) {
          const initialFeature = clickedFeatures[0]
          const initialLayerId = initialFeature.layer.id

          // calculate stats for focus area
          if (initialLayerId === FocusAreasLayer.layer.id) {
            this.onFocusAreaClick(initialFeature.id)
            return
          }

          // open/close a modal
          if (this.modalLayers.indexOf(initialLayerId) > -1) {
            this.handleModal(initialFeature)
            return
          }

          // do nothing for this layer, but try to find action for the next layer in the stack
          clickedFeatures.shift(); // remove initial feature
          if (clickedFeatures.length > 0) {
            this.actionForClick(clickedFeatures)
          }
        },
        /* opens or closes modal */
        handleModal(initialFeature) {
          this.selectedObjectId = initialFeature.properties["city_scope_id"] || "amenity"  // TODO make id for ameniteis

          if (this.openModalsIds.indexOf(this.selectedObjectId) !== -1) {
            console.log("closing modal ", this.selectedObjectId)
            this.$modal.hide(this.selectedObjectId);

            return
          }

          // create new modal
          this.createModal()
        },
        onMapLoaded () {
            this.$store.dispatch('addFocusAreasMapLayer')
            console.log("create design layers")
            //console.log(this.$store.state.map);
            this.$store.dispatch('createDesignLayers').then(() => {
                this.$store.dispatch('orderDesignLayers').then(() => {
                  this.map.setLayoutProperty(FocusAreasLayer.mapSource.data.id, 'visibility', 'none');
                  if(this.workshop){
                        this.map.setLayoutProperty('upperfloor', 'visibility', 'none');
                    }
                });
            })
        },
        createModal(){
          this.openModalsIds.push(this.selectedObjectId)
          this.$modal.show(
              Contextmenu,
             {},
             {name: this.selectedObjectId, draggable: window.innerWidth >= 1024 ? true : false, width:280, adaptive: true, shiftX: this.lastClicked[0] + 0.125, shiftY: this.lastClicked[1] + 0.125}
          )
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
        onFocusAreaClick (selectedFocusArea) {
          console.log("click focus area")
          const idx = this.selectedFocusAreas.indexOf(selectedFocusArea)
          if (idx > -1) {
            // if area already selected -> deselect focus area
            this.selectedFocusAreas.splice(idx, 1);
            this.map.setFeatureState(
              { source: 'focusAreas', id: selectedFocusArea },
              { clicked: false, hover: false }
            )
            // update charts
            this.updateAbmStatsChart = true
            this.updateAmenityStatsChart = true
          } else {
            // add to selected areas
            this.selectedFocusAreas.push(selectedFocusArea)
            this.map.setFeatureState(
              { source: 'focusAreas', id: selectedFocusArea },
              { clicked: true, hover: false }
            )
            // compute results.
            calculateAmenityStatsForFocusArea(selectedFocusArea)
            calculateAbmStatsForFocusArea(selectedFocusArea)
          }
      }
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
