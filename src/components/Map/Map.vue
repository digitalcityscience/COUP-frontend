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
import * as turf from '@turf/turf'
import {functionalThemeClasses} from "vuetify/src/mixins/themeable/index"; // TODO remove import


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
            circledFeatures: []
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
            ['openModals', 'openModals'],
            ['modalInfo', 'modalInfo']
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

          // create new modal for clickedFeatures
          /* gather information for modal, depending on layer selected */
          switch (initialLayerId) {
            // for click on building part
            case "rooftops":
            case "upperfloor":
            case "groundfloor":
            case  Amenities.layer.id:
              this.handleModal(clickedFeatures)
              break;
            // for click on focus Areas
            case FocusAreasLayer.layer.id:
              // focus area clicked. do not open modals, calculate stats
              this.onFocusAreaClick(initialFeature.id)
              break;
            // do nothing for this layer, but try to find action for the next layer in the stack
            default:
              console.log("Click on Layer ", initialLayerId)
              console.log("no action defined for click on this layer")
              clickedFeatures.shift(); // remove initial feature
              if (clickedFeatures.length > 0) {
                // try to find an action for next feature
                this.actionForClick(clickedFeatures)
              }
              break;
          }
        },
        /* opens or closes modal */
        handleModal(clickedFeatures) {
          const cityScopeId = clickedFeatures[0].properties["city_scope_id"] || "amenities"  //TODO!!

          // close open modal for clickedFeatures
          if (this.openModals.indexOf(cityScopeId) !== -1) {
            // features are already selected.
            // set as inactive, close modal and return
            this.handleFeatureHighlighting(clickedFeatures)
            this.openModals.splice(this.openModals.indexOf(cityScopeId), 1);  // remove from open modals
            this.$modal.hide(this.modal_id);
            return
          }

          // new object selected, highlight and create modal
          this.gatherModalInfo(clickedFeatures, cityScopeId)
          this.handleFeatureHighlighting(clickedFeatures)
          this.createModal(cityScopeId)
        },
        gatherModalInfo(clickedFeatures, cityScopeId) {
          // set all components of selected building as selectedFeatures
          this.modalInfo = {
            "objectType": "",
            "objectId": cityScopeId,
            "generalContent" : [], // [{ propTitle: propValue}, ..]}
            "detailContent" : {} // header : [{ propTitle: propValue}]}
          }

          // find targeted building by id
          clickedFeatures.forEach((feature,i,a) => {
            const layerId = feature.layer.id
            switch (layerId) {
              case "groundfloor":
                this.modalInfo["objectType"] = "building"
                this.addBuildingFloorInfo(feature, cityScopeId)
                // add also roof type here when available
                break;
              case "rooftop":
                this.modalInfo["objectType"] = "building"
                this.addBuildingFloorInfo(feature, cityScopeId)
                break;
              case "upperfloor":
                this.modalInfo["objectType"] = "building"
                this.addBuildingFloorInfo(feature, cityScopeId)
                this.modalInfo["generalContent"].push(
                  {"building height": feature.properties["building_height"].toString() + "m"}
                )
                break;
              case Amenities.layer.id:
                this.modalInfo["objectType"] = "amenity"
                this.modalInfo["detailContent"]["Amenity"] = {}
                const alkisId = feature.properties.GFK
                feature.properties["useType"] = alkisTranslations[alkisId] || alkisId
                this.modalInfo["detailContent"]["Amenity"] = [
                  {"New amenity ?": feature.properties["Pre-exist"] ? "No" : "Yes"},
                  {"Use Type": feature.properties["useType"]},
                  {"GFK": feature.properties.GFK}
                ]
                this.selectedFeatures.push(feature)
                break;
            }
          })
        },
        addBuildingFloorInfo(feature, cityScopeId) {
          if(feature.properties.city_scope_id == cityScopeId) {
            this.modalInfo["detailContent"][feature.layer.id] = [
              {"use case": feature.properties.land_use_detailed_type},
              {"floor area": Math.round(feature.properties["floor_area"]).toString() + "m²"}
            ]
          }
        },
        handleFeatureHighlighting(clickedFeatures) {
        // set display properties for selected features to change volume colors
          clickedFeatures.forEach(feature => {
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
          this.handleFeatureCircling(clickedFeatures)
        },
        /** circles or uncircles clickedFeatures */
        handleFeatureCircling(clickedFeatures) {
          let buffer = null
          clickedFeatures.every(feature => {
            if (feature.layer.id === "groundfloor") {
              console.log("groundfloor found", feature)
              buffer = turf.buffer(turf.polygon(feature.geometry.coordinates), 0.01)
              // if a ground floor found: jump out - user click on building. any amenity will be accidentally in region
              return false;
            }
            if (feature.layer.id === Amenities.layer.id) {
              buffer = turf.buffer(turf.point(feature.geometry.coordinates), 0.01)
            }
            return true;
          })

          // remove if clicked feature already circled
          if (this.circledFeatures.indexOf(buffer) > -1) {
            this.circledFeatures.splice(this.circledFeatures.indexOf(buffer), 1);
          } else {
            // else..circle now
            this.circledFeatures.push(buffer)
          }
          // update circled features
          this.$store.dispatch("addCircledFeaturesLayer", this.circledFeatures)
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
        createModal(cityScopeId){
          this.openModals.push(cityScopeId)
          this.$modal.show(
              Contextmenu,
             {},
             {name: cityScopeId, draggable: window.innerWidth >= 1024 ? true : false, width:280, adaptive: true, shiftX: this.lastClicked[0] + 0.125, shiftY: this.lastClicked[1] + 0.125}
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
