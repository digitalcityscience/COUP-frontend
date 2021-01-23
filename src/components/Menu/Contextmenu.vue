<script>
import { mapState } from 'vuex'
import * as turf from '@turf/turf'
import Trips from "@/assets/trips.json"
import Amenities from "@/assets/amenities.json"
import {alkisTranslations} from "@/store/abm";
import {generateStoreGetterSetter} from "@/store/utils/generators";


export default {
    name: 'Contextmenu',
    components: {},
    data() {
        return {
            lineCanvasId: null,
            active: false,
            indexVal:0,
            modalDiv:'',
            dragging: false,
            windowWidth: window.innerWidth,
            objectFeatures: [],
            objectId: null,
            modalInfo: {},


            asOrigin:false, // todo move
            asDestination:false, // todo move
        }
    },
    computed: {
      ...mapState([
        'allFeaturesHighlighted',
        'map',
        ]),
      ...generateStoreGetterSetter([
        ['openModalsIds', 'openModalsIds'],
      ]),
        // city_scope_id of the clicked object (set in Map.vue, onMapClick)
        selectedObjectId() {
          return this.$store.state.selectedObjectId;
        },
        modalIndex(){
            return this.$store.state.scenario.modalIndex;
        },
        abmTrips(){
            return this.$store.state.scenario.abmTrips;
        }
    },
    beforeMount(){
      if (!this.selectedObjectId) {
        console.log("Tried to open modal, but no selectedObjectId given")
        return
      }

      // new object selected, circleObject and create modal
      this.objectId = this.selectedObjectId.toString()  // disconnect from store
      this.createObjectFeatures()
      this.gatherModalInfo()
      this.toggleFeatureCircling()
      this.toggleFeatureHighlighting()
    },
    mounted(){
        let selector = this.$el;
        this.modalDiv = selector.closest(".vm--modal");
        this.selectedModal();

        if(window.innerWidth >= 1024){
            this.sleep(300).then(() => { this.createLineOnCanvas(); });
        }

        this.active = true;

        if(window.innerWidth >= 1024){
            this.map.on('drag', this.createLineOnCanvas);
            this.map.on('zoom', this.createLineOnCanvas);
            this.map.on('rotate', this.createLineOnCanvas);
        }
        window.addEventListener('mouseup', this.stopDrag);
    },
    updated(){
    },
    beforeDestroy() {
      this.toggleFeatureCircling()

      if (!this.allFeaturesHighlighted) {
        this.toggleFeatureHighlighting()
      }

      // remove line on canvas connecting modal to selected feature
      const canvas = document.getElementById(this.lineCanvasId);
      canvas.remove();
      this.active = false;

      this.openModalsIds.splice(this.openModalsIds.indexOf(this.selectedObjectId), 1);
    },
    methods:{
        createObjectFeatures() {
          const renderedFeatures = this.map.queryRenderedFeatures()
          this.objectFeatures = renderedFeatures.filter(feat => {
            return feat.properties["city_scope_id"] === this.objectId
          })
        },
        gatherModalInfo() {
          this.modalInfo = {
            "objectType": "",
            "generalContent" : [], // [{ propTitle: propValue}, ..]}
            "detailContent" : {} // header : [{ propTitle: propValue}]}
          }

          // iterate over objects features and add modal info, depending on feature layer or type
          this.objectFeatures.forEach((feature,i,a) => {
            const layerId = feature.layer.id
            switch (layerId) {
              case "groundfloor":
                this.modalInfo["objectType"] = "building"
                this.modalInfo["coords"] = turf.centroid(turf.polygon(feature.geometry.coordinates)).geometry.coordinates
                this.addBuildingFloorInfo(feature)
                break;
              case "rooftop":
                // add also roof type here when available
                this.addBuildingFloorInfo(feature)
                break;
              case "upperfloor":
                this.addBuildingFloorInfo(feature)
                this.modalInfo["generalContent"].push(
                  {"building height": feature.properties["building_height"].toString() + "m"}
                )
                break;
              case Amenities.layer.id:
                this.modalInfo["objectType"] = "amenity"
                this.modalInfo["coords"] =feature.geometry.coordinates
                this.modalInfo["detailContent"]["Amenity"] = {}
                const alkisId = feature.properties.GFK
                feature.properties["useType"] = alkisTranslations[alkisId] || alkisId
                this.modalInfo["detailContent"]["Amenity"] = [
                  {"New amenity ?": feature.properties["Pre-exist"] ? "No" : "Yes"},
                  {"Use Type": feature.properties["useType"]},
                  {"GFK": feature.properties.GFK}
                ]
                break;
            }
          })
        },
        addBuildingFloorInfo(feature) {
          this.modalInfo["detailContent"][feature.layer.id] = [
              {"use case": feature.properties.land_use_detailed_type},
              {"floor area": Math.round(feature.properties["floor_area"]).toString() + "m²"}
            ]
        },
        toggleFeatureHighlighting() {
          if (this.allFeaturesHighlighted) {
            // do not change highlighting
            return
          }
          // update properties for all objectFeatures
          this.objectFeatures.forEach(feature => {
            // set display properties for selected features to change volume colors
            const alreadyHighlighted = (feature.properties.selected === "active")
            feature.properties.selected = alreadyHighlighted ? "inactive" : "active";
            this.$store.dispatch('editFeatureProps', feature);
          })
        },
        /** circles or uncircles clickedFeatures */
        toggleFeatureCircling() {
          let buffer = null

          // find geometry to create circle around the object
          this.objectFeatures.every(feature => {
            if (feature.layer.id === "groundfloor") {
              buffer = turf.buffer(turf.polygon(feature.geometry.coordinates), 0.01)
              // if a ground floor found: jump out - it is the perfect geometry for circling a building
              return false;
            }
            if (feature.layer.id === "upperfloor") {
              buffer = turf.buffer(turf.polygon(feature.geometry.coordinates), 0.01)
              // if a upper floor found: take as fallback geometry for circling.
              return true;
            }
            if (feature.layer.id === Amenities.layer.id) {
              buffer = turf.buffer(turf.point(feature.geometry.coordinates), 0.01)
            }
              return true;
          })
          // update circled features
          buffer.properties["objectId"] = this.objectId
          this.$store.dispatch("updateCircledFeaturesLayer", buffer)
        },
        getProjectedObjectCoords() {
          return this.map.project(this.modalInfo["coords"])
        },
          /** todo raus hier*/
        updateTrips(objectData, originOrDestination) {
          console.log("objectData")
          console.log(objectData)
          console.log("originOrDestination")
          console.log(originOrDestination)
          const amenityPoint = this.modalInfo["coords"]

          //let odPoints = turf.featureCollection(this.$store.state.scenario.abmTrips.map((trip) => {
          let trips = JSON.parse(JSON.stringify(Trips))
          let destinations = turf.featureCollection(trips.map((trip) => {
            return turf.point(trip["destination"], {"trip": trip})
          }))
          let origins = turf.featureCollection(trips.map((trip) => {
              return turf.point(trip["origin"], {"trip": trip})
          }))

          console.log("origins", origins)

          let odPoints = originOrDestination === "origin" ? origins : destinations

          let filteredOdPoints = []
          turf.featureEach(odPoints, function(odPoint) {
            if (turf.distance(amenityPoint, odPoint) < 0.01) {
              // use nearest point! (when using amenity as base)
              filteredOdPoints.push(odPoint)
            }
          })

          console.log("od count for bld", filteredOdPoints.length)

          this.map.addLayer({
              'id': 'myBuilding' + Math.random().toString(),
              'type': 'fill',
              'source': {
                'type': 'geojson',
                'data': buildingPolygon
              },
              'layout': {},
              'paint': {
                'fill-color': 'red',
                'fill-opacity': 0.3
              }
            });

          this.map.addLayer({
              'id': 'origins' + Math.random().toString(),
              'type': 'circle',
              'source': {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': origins.features
                }
              },
              'layout': {},
              'paint': {
                "circle-opacity": 1,
                "circle-color":  "blue"
              }
            });

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

            this.map.addLayer({
              'id': 'destinations' + Math.random().toString(),
              'type': 'circle',
              'source': {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': destinations.features
                }
              },
              'layout': {},
              'paint': {
                "circle-opacity": 1,
                "circle-color":  "pink"
              }
            });

            this.map.addLayer({
              'id': 'filterdodPoints' + Math.random().toString(),
              'type': 'circle',
              'source': {
                'type': 'geojson',
                'data': {
                  'type': 'FeatureCollection',
                  'features': turf.featureCollection(filteredOdPoints).features
                }
              },
              'layout': {},
              'paint': {
                "circle-opacity": 1,
                "circle-color":  "purple"
              }
            });
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        selectedModal(){
            this.indexVal = this.modalIndex + 1;
            let selector = this.$el;
            let targetModal = selector.closest(".vm--container");
            targetModal.style.zIndex = this.indexVal;
            this.$store.commit('scenario/modalIndex', this.indexVal);  // todo do not put this in scenario
        },
         /** creates a line on canvas connecting the modal box to it's object as anchor */
        createLineOnCanvas(){
           if(window.innerWidth >= 1024) {
             if (this.active) {
               this.lineCanvasId = "line_" + this.objectId;
               const boxContainer = document.getElementById("line_canvas");
               if (document.getElementById(this.lineCanvasId)) {
                 // remove existing line container
                 boxContainer.removeChild(document.getElementById(this.lineCanvasId))
               }

               // create canvas
               let canvas = document.createElement('canvas');
               canvas.id = this.lineCanvasId
               canvas.width = window.innerWidth;
               canvas.height = window.innerHeight;
               canvas.style.position = "absolute";
               boxContainer.appendChild(canvas);
               var context = canvas.getContext('2d');

               const projectedObjectCoords = this.getProjectedObjectCoords()
               const anchorConnnection = {
                 x: projectedObjectCoords.x,
                 y: projectedObjectCoords.y,
               }

               const boxConnection = {}
               boxConnection.x = parseInt(this.modalDiv.style.left, 10) + this.modalDiv.getBoundingClientRect().width / 2;
               boxConnection.y = parseInt(this.modalDiv.style.top, 10) + this.modalDiv.getBoundingClientRect().height / 2;

               context.canvas.width = window.innerWidth;
               context.canvas.height = window.innerHeight;
               context.beginPath();
               context.lineWidth = "1";
               context.strokeStyle = "#FEE351";
               context.moveTo(Math.round(boxConnection.x), Math.round(boxConnection.y));
               context.lineTo(Math.round(anchorConnnection.x), Math.round(anchorConnnection.y));
               context.stroke();
             }
           }
        },
        startDrag() {
            this.dragging = true;
        },
        stopDrag() {
            this.dragging = false;
        },
        doDrag(event) {
            if (this.dragging && window.innerWidth >= 1024) {
                this.createLineOnCanvas();
            }
        }
    }
}
</script>

<template>
    <div class="ctx_menu" @click="selectedModal()"  @mousedown="startDrag" @mousemove="doDrag" v-bind:style="{ zIndex: indexVal }">
        <div class="wrapper">
            <div class="ctx_bar"><v-icon size="18px">mdi-city</v-icon> <p>{{ modalInfo.objectType }} - {{ modalInfo.objectId }}</p><div class="close_btn" @click="$emit('close')"><v-icon>mdi-close</v-icon></div></div>
            <div class="general" v-for="item in modalInfo.generalContent"><p>
                <div v-for="(value, key) in item">
                  <p>{{ key }} : {{ value }}</p>
                </div>
              </div>
            </div>
            <div class="head_scope" v-for="(content, name) in modalInfo.detailContent">
                <div class="head_bar"><h3>{{ name }}</h3></div>
                    <div v-for="ctx in content">
                      <div v-for="(value, key) in ctx">
                        <p><strong>{{ key }}</strong> {{value}} </p>
                      </div>
                    </div>
            </div>
          <!-- amenities -->
          <div v-if="modalInfo.objectType === 'amenity'">
            <div class="body_scope"></div>
            <div class="od-menu">
              <v-checkbox
                v-model="this.asOrigin"
                label="Origin of"
                @change="updateTrips(objectFeatures, 'origin')"
                dark
                hide-details
              ></v-checkbox>
              <v-checkbox
                v-model="this.asDestination"
                label="Destination of"
                @change="updateTrips(objectFeatures, 'destination')"
                dark
                hide-details
              ></v-checkbox>
            </div>
          </div>
        </div>
        <!--<svg class="connection"><line :x1="Math.round(anchorConnnection.x)" :y1="Math.round(anchorConnnection.y)" :x2="Math.round(boxConnection.x)" :y2="Math.round(boxConnection.y)" stroke-width="1px" stroke="white"/></svg>-->
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    .ctx_menu {
        position:relative;
        //position:fixed;
        width:280px;
        //min-height:200px;
        background:rgba(0,0,0,0.75);
        max-width:100%;
        padding:5px;
        border:1px solid #FEE351;
        box-sizing: border-box;
        @include drop_shadow;

        .ctx_bar {
            position:relative;
            display:flex;
            width:100%;
            height:30px;
            line-height:30px;
            background:$reversed;
            padding:0px 5px;

            .v-icon {
                opacity:1;
                filter:invert(1);
                flex:0 0 35px;
            }

            p {
                color:whitesmoke;
                font-size:100%;
                strong {
                    font-size:80%;
                    color:#ddd;
                }
            }

            .close_btn {
                position:absolute;
                top:0;
                right:0;
                width:30px;
                height:30px;
                border:2px solid white;

                .v-icon {
                    position:absolute;
                    left:50%;
                    top:50%;
                    transform:translate(-50%,-50%);
                    color:black;
                    font-size:15px;
                }
            }

            &:hover {
                cursor:pointer;
            }
        }

        .general {
            padding:5px;
            box-sizing: border-box;

            p {
                font-size:80%;
                color:whitesmoke;
                font-weight:300;
            }
        }

        .head_scope{
            width:90%;
            margin:5px auto;
            color:whitesmoke;
            border:1px solid #444;
            box-sizing: border-box;
            font-size:80%;

            .head_bar {
                position:relative;
                margin:5px auto;
                padding:0px 10px;
                box-sizing: border-box;
                width:95%;
                height:30px;
                line-height:30px;
                font-size:100%;
                z-index:3;
                //background:linear-gradient(45deg, $red, transparent);
                @include drop_shadow;

                &:after {
                    @include fullpseudo;
                    background:$greyblue;
                    opacity:0.75;
                    z-index:-1;
                }

                 h3 {
                color:whitesmoke;
                font-size:100%;
                font-weight:300;
                }
            }

            p {
                border-top:1px solid #444;
                padding:2px 10px;
                box-sizing: border-box;
                &:first-child {
                    border:none;
                }
            }
        }

        &:hover {
            border:1px solid $orange;
            background:rgba(0,0,0,0.95);
        }

        @media(max-device-width:1023px){
            position:fixed;
            width:80%;
            max-width:400px;
            min-height:50vh;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            border:none;
            background:rgba(0,0,0,0.85);
            backdrop-filter:blur(10px) saturate(180%);
        }
    }

</style>
