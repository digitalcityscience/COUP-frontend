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
import Amenities from "@/config/amenities.json";
import AmenitiesGeoJson from "@/assets/amenities.json";  // TODO remove import
import * as turf from '@turf/turf' // TODO remove import


export default {
    name: 'Map',
    components:{ Contextmenu },
    data() {
        return {
            lastClicked: [],
            featuresObject: {},
            targetFound: false,
            showModal: false, // TODO rename in showModal
            hoveredFocusArea: null,
            modalId: null
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
            ['showLegend', 'showLegend' ],
            ['loader', 'scenario/loader' ],
            ['selectedFocusAreas', 'scenario/selectedFocusAreas' ],
            ['updateAbmStatsChart', 'scenario/updateAbmStatsChart'],
            ['updateAmenityStatsChart', 'scenario/updateAmenityStatsChart'],
            ['selectedFeatures', 'selectedFeatures']
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
        this.map.on('contextmenu', this.onMapContextMenu)

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

                if(this.targetFound){this.openContextMenu();}
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
        actionForClick(features) {
          console.log("click features")
          console.log(features)
          const initialFeature = features[0]
          const initialLayerId = initialFeature.layer.id

          /* choose what to do, depending on layer selected */
          switch (initialLayerId) {
            // for click on building
            case "upperfloor":
            case "groundfloor":
            case "rooftops":
              // set all components of selected building as selectedFeatures
              this.selectedFeatures = []
              const cityScopeId = initialFeature.properties.city_scope_id
              this.modalId = cityScopeId

              // find targeted building by id
              features.forEach((feature,i,a) => {
                if(feature.properties.city_scope_id == cityScopeId) {
                  feature["objectType"] = "building"
                  feature["objectId"] = cityScopeId
                  this.selectedFeatures.push(feature);
                }
              });
              this.updateSelectedFeatureProps()

              this.targetFound = true;
              break;

            // for click on an amenity
            case Amenities.layer.id:
              // open modal with info on amenity
              console.log("amenity")
              console.log(initialFeature)
              console.log("coordinates")
              console.log(initialFeature["geometry"]["coordinates"])

              this.modalId = "amenity" + Math.random().toString()  // amenities have no id...
              initialFeature["objectType"] = "amenity"
              const alkisId = initialFeature.properties.GFK
              initialFeature.properties["useType"] = alkisTranslations[alkisId] || alkisId
              this.selectedFeatures = [initialFeature]

              this.updateSelectedFeatureProps()
              this.targetFound = true;
              break;
            // for click on focus Areas
            case FocusAreasLayer.layer.id:
              this.targetFound = false;  // do not open modal
              this.onFocusAreaClick(initialFeature.id)
              break;
            // do nothing for this layer, but try to find action for the next layer in the stack
            default:
              console.log("Click on Layer ", initialLayerId)
              console.log("no action defined for click on this layer")
              features.shift(); // remove initial feature
              if (features.length > 0) {
                // try to find an action for next feature
                console.log("try next layer")
                this.actionForClick(features)
              }
              break;
          }
        },
        updateSelectedFeatureProps() {
          // set display properties for selected features
          this.selectedFeatures.forEach(feature => {
            if(feature.properties.selected != 'active'){
              feature.properties.selected = "active";
              this.showModal = true;
              this.$store.dispatch('editFeatureProps', feature);
            } else {
              if(!this.allFeaturesHighlighted){
                feature.properties.selected = "inactive";
                this.showModal = false;
                this.$store.dispatch('editFeatureProps', feature);
              } else {
                feature.properties.selected = "active";
                this.showModal = true;
                this.$store.dispatch('editFeatureProps', feature);
              }
            }
          });
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

          // TODO for faster dev only
          const amenities = turf.featureCollection(AmenitiesGeoJson["features"])
          this.map.addLayer({
            'id': 'abmAmenities',
            'type': 'circle',
            'source': {
              'type': 'geojson',
              'data': {
                'type': 'FeatureCollection',
                'features': amenities.features
              }
            },
            'layout': {},
            'paint': {
              "circle-opacity": 1,
              "circle-color":  "yellow"
            }
          });
          this.$store.commit('addLayerId', "abmAmenities")
        },
        /** TODO: refactor this **/
        // if all features are highlighted, remove highlight from building that has been right-clicked
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
                                    this.showModal = false;
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
            // this.featuresObject = {click: this.lastClicked};  // TODO remove if not needed
            console.log(this.selectedFeatures);
            console.log("selected Features", this.selectedFeatures)
            if(this.showModal){
                this.$modal.show(
                    Contextmenu,
                    {"test": "testValue"},  // TODO context info here?
                    {name: this.modal_id, draggable: window.innerWidth >= 1024 ? true : false, width:280, adaptive: true, shiftX: this.lastClicked[0] + 0.125, shiftY: this.lastClicked[1] + 0.125}
                )
            } else {
                this.$modal.hide(this.modal_id);
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
