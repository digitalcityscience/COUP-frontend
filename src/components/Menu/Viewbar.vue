<script>
import { mapState } from 'vuex'
import {generateStoreGetterSetter} from "@/store/utils/generators";
import UseTypesLegend from "@/components/Menu/UseTypesLegend.vue";
import FocusAreasLayerConfig from "@/config/focusAreas.json";
import MultiLayerAnalysisConfig from "@/config/multiLayerAnalysis.json";

export default {
    name: 'Viewbar',
    components: { UseTypesLegend },
    data() {
        return {
            toggleFeatures: false,
            brightness:1,
            showUi: true,
            visibility: {
                layers: false,
                buildings: false,
                slider: false,
            },
            visibleLayers: {
                focusAreas: false,
                abm: true,
                heat: true,
                noise: true,
                stormwater: true,
                microclimate: true,
                multiLayerAnalysis: true,
            },
            visibleBuildings: {
                show: true,
                highlight: false,
                amenities: true,
            },
            legendVisible: false,
            presentationRunning: false,
        }
    },
    computed: {
        ...mapState([
            'mapStyle',
            'view',
            'accessToken',
            'map',
            'activeMenuComponent',
            'layers',
            'selectedMultiFeatures',
        ]),
      ...generateStoreGetterSetter([
        ['allFeaturesHighlighted', 'allFeaturesHighlighted' ],
        ['showLegend', 'showLegend' ],
        ['focusAreasShown', 'focusAreasShown' ]
      ]),
      layerIds() {
          return this.$store.state.layerIds
      },

      workshop(){
          return this.$store.state.workshop;
      },
      loader(){
          return this.$store.state.scenario.loader;
      },
      abmData(){
          return this.$store.state.scenario.abmData;
      },
      heatMap(){
          return this.$store.state.scenario.heatMap;
      },
      noiseMap(){
          return this.$store.state.scenario.noiseMap;
      },
      stormWater(){
          return this.$store.state.scenario.stormWater;
      },
      microClimate(){
          return this.$store.state.scenario.microClimate;
      },
      multiLayerAnalysis(){
          return this.$store.state.map.getLayer("multiLayerAnalysis");
      }
    },
    watch: {
        abmData(){},
        heatMap(newVal, oldVal){
            console.log(newVal, oldVal);
        },
        noiseMap(){},
        stormWater(){},
        microClimate(){},
        focusAreasShown(newVal, oldVal){
          this.visibleLayers.focusAreas = newVal
        },
    },
    methods:{
        toggleUi(){
            this.showUi = !this.showUi;
            this.$store.commit("scenario/showUi", this.showUi);
        },
        resetView(){
            this.map.flyTo({
                center: this.view.center,
                zoom: this.view.zoom,
                bearing: this.view.bearing,
                pitch: this.view.pitch,
            });
        },
        changeBrightness(){
            const mapCanvas = document.querySelector(".mapboxgl-canvas");
            let brightnessValue = 1 + this.brightness/100;
            let satureateValue = 1 + this.brightness/500;
            mapCanvas.style.filter = "brightness(" + brightnessValue + ") saturate("+ satureateValue +")";
        },
        openUseTypesLegend(){
          this.showLegend = true
          this.$modal.show(
            UseTypesLegend,
            {},
            {draggable: true, width:200, adaptive: true, clickToClose: true,  shiftX: 0.025, shiftY: 0.1}
          )
        },
        highlightAllFeatures(){

            this.$store.commit("scenario/loader", true);
            console.log(this.loader)

            if(this.allFeaturesHighlighted){
                this.allFeaturesHighlighted = false;
                const featuresToRemove = this.selectedMultiFeatures;

                featuresToRemove.forEach(feature => {
                    feature.properties.selected = "inactive";
                    this.$store.dispatch('editFeatureProps', feature);
                })

            } else {
                this.allFeaturesHighlighted = true;
                //this.openUseTypesLegend();

                const bbox = [
                    [0, 0],
                    [window.innerWidth, window.innerHeight]
                ]

                //console.log(this.layerIds);
                const features = this.map.queryRenderedFeatures(bbox, {
                    layers: this.layerIds
                });

                this.$store.commit('selectedMultiFeatures', features);
                const newFeature = this.selectedMultiFeatures;

                newFeature.forEach(feature => {
                        feature.properties.selected = "active";
                        this.$store.dispatch('editFeatureProps', feature);
                    })
            }


            this.$store.commit("scenario/loader", false);
            console.log(this.loader)
        },
        updateBuildingVisibility(){
            console.log(this.layerIds);
            if(!this.visibleBuildings.show){
                this.map.setLayoutProperty("groundfloor", 'visibility', 'none');
                this.map.setLayoutProperty("upperfloor", 'visibility', 'none');
                this.map.setLayoutProperty("rooftops", 'visibility', 'none');
            } else {
                this.map.setLayoutProperty("groundfloor", 'visibility', 'visible');
                this.map.setLayoutProperty("upperfloor", 'visibility', 'visible');
                this.map.setLayoutProperty("rooftops", 'visibility', 'visible');
            }

            if(!this.visibleBuildings.amenities){
                this.map.setLayoutProperty("abmAmenities", 'visibility', 'none');
            } else {
                this.map.setLayoutProperty("abmAmenities", 'visibility', 'visible');
            }
        },
        updateLayerVisibility(){
            console.log(this.layerIds);
            if(this.layerIds.indexOf("abmTrips") > -1){
                if(this.visibleLayers.abm){
                    this.map.setLayoutProperty("abmTrips", 'visibility', 'visible');
                } else {
                    this.map.setLayoutProperty("abmTrips", 'visibility', 'none');
                }
            }

            if(this.layerIds.indexOf("abmHeat") > -1){
                if(this.visibleLayers.heat){
                    this.map.setLayoutProperty("abmHeat", 'visibility', 'visible');
                    //this.$store.commit("scenario/heatMapVisible", true);
                } else {
                    this.map.setLayoutProperty("abmHeat", 'visibility', 'none');
                    //this.$store.commit("scenario/heatMapVisible", false);
                }

                //this.$store.dispatch('scenario/rebuildTripsLayer', this.filterSettings);
            }

            if(this.layerIds.indexOf("noise") > -1){
                if(this.visibleLayers.noise){
                    this.map.setLayoutProperty("noise", 'visibility', 'visible');
                } else {
                    this.map.setLayoutProperty("noise", 'visibility', 'none');
                }
            }
            if(this.layerIds.indexOf("focusAreas") > -1){
              console.log("visible layers", this.visibleLayers)
                if(this.visibleLayers.focusAreas){
                  this.map.setLayoutProperty(FocusAreasLayerConfig.mapSource.data.id, 'visibility', 'visible');
                } else {
                  this.map.setLayoutProperty(FocusAreasLayerConfig.mapSource.data.id, 'visibility', 'none');
                }
            }
           if(this.layerIds.indexOf("multiLayerAnalysis") > -1){
            console.log("visible layers", this.visibleLayers)
            if(this.visibleLayers.multiLayerAnalysis){
              this.map.setLayoutProperty(MultiLayerAnalysisConfig.layer.id, 'visibility', 'visible');
            } else {
              this.map.setLayoutProperty(MultiLayerAnalysisConfig.layer.id, 'visibility', 'none');
            }
          }
        },
        checkHighlights(active){
            Object.entries(this.visibility).map(([key, value]) => {
                return key == active ? this.visibility[key] = !this.visibility[key] : this.visibility[key] = false
            });
        },
        async adjustPitch(){
            var zoom = this.map.getZoom();
            var pitch = this.map.getPitch();
            var bearing = this.map.getBearing();

            if(zoom > 16 || zoom < 9){
                this.map.setZoom(13);
            }

            if(pitch < 25){
                this.map.setPitch(45);
            }

            /*if(bearing < 35){
                this.map.setBearing(65);
            }*/
        },
        presentationMode(){
            this.presentationRunning = !this.presentationRunning;

            if(this.presentationRunning){
                this.adjustPitch().then(
                    this.rotateCamera(0)
                )
            }
        },
        rotateCamera(timestamp) {
            this.map.rotateTo((timestamp / 200) % 360, { duration: 0 });
            // Request the next frame of the animation.
            if(this.presentationRunning){
                requestAnimationFrame(this.rotateCamera);
            }
        },
    }
}
</script>

<template>
   <div id="viewbar">
       <div class="button_bar">
         <!--<v-btn v-if="allFeaturesHighlighted"  @click="openUseTypesLegend" v-bind:class="{ circleObject: showLegend }"><v-tooltip right>
             <template v-slot:activator="{ on, attrs }">
               <v-icon
                 v-bind="attrs"
                 v-on="on"
               >mdi-map-legend</v-icon>
             </template>
             <span>Use Types Legend</span>
           </v-tooltip>
           </v-btn>-->
        <v-btn v-if="legendVisible" class="legend"><v-icon style="color: #FFD529;">mdi-city</v-icon> <div class="infobox"><p>Residential</p></div></v-btn>
        <v-btn v-if="legendVisible" class="legend"><v-icon style="color: #ab0124;">mdi-city</v-icon> <div class="infobox"><p>Commercial</p></div></v-btn>
        <v-btn v-if="legendVisible" class="legend"><v-icon style="color: #1380AB;">mdi-city</v-icon> <div class="infobox"><p>Special Use</p></div></v-btn>
         <v-btn v-if="!workshop" v-bind:class="{ highlight: visibility.buildings }"><v-tooltip right>
           <template v-slot:activator="{ on, attrs }">
            <span @click="checkHighlights('buildings')">
             <v-icon
               v-bind="attrs"
               v-on="on"
             >mdi-city</v-icon>
             </span>
           </template>
           <span>Highlight All Buildings</span>
         </v-tooltip>
         <div v-if="visibility.buildings" class="view_popup buildings">
             <v-checkbox
                v-model="visibleBuildings.show"
                label="Show Buildings"
                @change="updateBuildingVisibility"
                dark
                hide-details
             ></v-checkbox>
             <v-checkbox
                v-model="visibleBuildings.highlight"
                label="Highlight All Buildings"
                @change="highlightAllFeatures"
                dark
                hide-details
                :disabled="visibleBuildings.show == false"
             ></v-checkbox>
             <v-checkbox
                v-model="visibleBuildings.amenities"
                label="Show Amenities"
                @change="updateBuildingVisibility"
                dark
                hide-details
                :disabled="abmData == null"
             ></v-checkbox>
             <v-btn class="legendbutton" @click="legendVisible = !legendVisible">
                 <v-icon>mdi-map-legend</v-icon>
                <template v-if="legendVisible">Hide Use Type Legend</template>
                <template v-else>Show Use Type Legend</template>
             </v-btn>
         </div>
         </v-btn>
         <v-btn v-if="!workshop" v-bind:class="{ highlight: visibility.layers }"><v-tooltip right>

           <template v-slot:activator="{ on, attrs }">
               <span  @click="checkHighlights('layers')">
             <v-icon
               v-bind="attrs"
               v-on="on"
             >mdi-layers</v-icon>
           </span>
           </template>
           <span>Layer Visibility</span>
         </v-tooltip>
         <div v-if="visibility.layers" class="view_popup">
             <div class="layers">
                 <h3>Focus Areas</h3>
                 <v-checkbox
                    v-model="visibleLayers.focusAreas"
                    label="Focus Areas Layer"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="false"
                 ></v-checkbox>
             </div>
             <div class="layers">
                 <h3>ABM Layers</h3>
                 <v-checkbox
                    v-model="visibleLayers.abm"
                    label="ABM Animation Layer"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="abmData == null"
                 ></v-checkbox>
                 <v-checkbox
                    v-model="visibleLayers.heat"
                    label="ABM Aggregation Layer"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="!heatMap"
                 ></v-checkbox>
             </div>
             <div class="layers">
                 <h3>Noise Layers</h3>
                 <v-checkbox
                    v-model="visibleLayers.noise"
                    label="Noise Polution"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="!noiseMap"
                 ></v-checkbox>
             </div>
             <div class="layers">
                 <h3>Stormwater Layers</h3>
                 <v-checkbox
                    v-model="visibleLayers.stormwater"
                    label="Stormwater Layer"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="!stormWater"
                 ></v-checkbox>
             </div>
             <div class="layers">
                 <h3>Microclimate Layers</h3>
                 <v-checkbox
                    v-model="visibleLayers.microclimate"
                    label="Microclimate Layer"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="!microClimate"
                 ></v-checkbox>
             </div>
           <div class="layers">
                 <h3>Multi Layer Analysis</h3>
                 <v-checkbox
                    v-model="visibleLayers.multiLayerAnalysis"
                    label="Multi Layer Analysis"
                    color="white"
                    dark
                    @change="updateLayerVisibility"
                    hide-details
                    :disabled="!multiLayerAnalysis"
                 ></v-checkbox>
             </div>
         </div>
         </v-btn>
         <v-btn class="light_view" v-bind:class="{ highlight: visibility.slider }" @click="checkHighlights('slider')"> <v-tooltip right>
                 <template v-slot:activator="{ on, attrs }">
                   <v-icon
                     v-bind="attrs"
                     v-on="on"
                   >mdi-lightbulb-on-outline</v-icon>
                 </template>
                 <span>Adjust Brightness</span>
               </v-tooltip>
                <div class="popup_cnt" v-if="visibility.slider">
                    <p>Adjust Map Lighting</p>
                    <v-slider
                        dark
                        min="1"
                        max="100"
                        v-model="brightness"
                        @change="changeBrightness"
                    >
                    <template v-slot:append>
                        <v-text-field
                            :value="brightness"
                            class="mt-0 pt-0"
                            single-line
                            readonly
                            type="number"
                        ></v-text-field>
                    </template>
                    </v-slider>
                </div>
           </v-btn>
           <v-btn class="reset_view" @click="resetView">
             <v-tooltip right>
               <template v-slot:activator="{ on, attrs }">
                 <v-icon
                   v-bind="attrs"
                   v-on="on"
                 >mdi-crosshairs-gps</v-icon>
               </template>
               <span>Home</span>
             </v-tooltip>
           </v-btn>
           <v-btn class="toggle_ui" @click="toggleUi">
             <v-tooltip right>
               <template v-slot:activator="{ on, attrs }">
                 <v-icon
                    v-if="showUi"
                    v-bind="attrs"
                    v-on="on"
                 >mdi-eye-off</v-icon>
                 <v-icon
                    v-else
                    v-bind="attrs"
                    v-on="on"
                 >mdi-eye</v-icon>
               </template>
               <span>Toggle UI</span>
             </v-tooltip>
           </v-btn>
        </div>

        <!--<div class="building_legend" v-if="legendVisible">
            <h3>Building Use Types</h3>
            <ul>
                <li><v-icon class="yellow">mdi-city</v-icon><p>Residential</p></li>
                <li><v-icon class="red">mdi-city</v-icon><p>Commercial</p></li>
                <li><v-icon class="blue">mdi-city</v-icon><p>Special Use</p></li>
            </ul>
        </div>-->
        <div class="rogue_btn" v-if="!showUi" :class="{ toggled: presentationRunning }">
            <v-btn @click="presentationMode">
                <v-tooltip left>
                    <template v-slot:activator="{ on, attrs }">
                        <v-icon
                            v-bind="attrs"
                            v-on="on"
                        >mdi-video</v-icon>
                    </template>
                    <span>Presentation Mode</span>
                </v-tooltip>
            </v-btn>
        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    #viewbar {
        position:fixed;
        left:10px;
        top:50%;
        transform:translateY(-50%);
        width:auto;
        background:transparent;

        .button_bar {
            display:flex;
            flex-flow:column wrap;
            width:40px;

            .v-btn {
                width:40px;
                min-width:0px;
                height:30px;
                margin:2px;
                background:rgba(255,255,255,0.9);
                @include drop_shadow;

                &.legend {
                    pointer-events:none;
                    background:rgba(0,0,0,0.9);

                    /*&.yellow {
                        .v-icon {
                            color:#FFB121;
                        }
                    }
                    &.red {
                        .v-icon {
                            color:#F76A6A;
                        }
                    }
                    &.blue {
                        .v-icon {
                            color:#4EBFFC;
                        }
                    }*/

                    .infobox {
                        width:100px;
                        height:28px;
                        position:absolute;
                        top:0;
                        left:34px;
                        background:rgba(0,0,0,0.75);
                        @include drop_shadow;

                        p {
                            text-transform: none;
                            color:whitesmoke;
                            line-height:28px;
                            font-size:90%;
                            font-weight:300;
                        }
                    }
                }

                .v-icon {
                    font-size:18px;
                }

                .view_popup {
                    position:absolute;
                    left:34px;
                    top:50%;
                    transform:translateY(-50%);
                    width:200px;
                    background:rgba(0,0,0,0.8);
                    @include drop_shadow;

                    &.buildings {
                        top:0;
                        transform:translateY(0);
                    }

                    .layers {
                        width:100%;

                        h3 {
                            width:100%;
                            background:#222;
                            @include drop_shadow;
                            font-size:12px;
                            padding:3px;
                            text-align:left;
                            color:#aaa;
                        }
                    }

                    .v-input--checkbox {
                        margin:5px 5px 5px 20px;

                        ::v-deep.v-input__control {
                            label {
                                text-transform:none;
                                color:white;
                                font-size:90%;
                                font-weight:200;
                            }
                        }
                    }

                    .legendbutton {
                        width:calc(100% - 20px);
                        background:$reversed;
                        color:whitesmoke;
                        font-size:85%;
                        font-weight:300;
                        text-transform:none;
                        border-radius:0px;
                        margin:10px auto;

                        .v-icon {
                            margin-right:5px;
                        }
                    }
                }

                .popup_cnt {
                    position:absolute;
                    left:34px;
                    top:0x;
                    width:200px;
                    background:rgba(0,0,0,0.8);
                    @include drop_shadow;

                    p {
                        color: #aaa;
                        text-transform: none;
                        font-size: 80%;
                        text-align: right;
                        padding: 0px 10px;
                        margin: 10px auto 5px auto;
                    }

                    .v-input {
                        position:relative;
                        width:90%;
                        margin:auto;

                        ::v-deep.v-input__append-outer {
                            position:absolute;
                            top: 15px;
                            left: 50%;
                            margin: 0;
                            transform:translateX(-50%);
                            pointer-events:none;

                            .v-input {
                                width:40px;
                                .v-input__control{
                                    .v-input__slot {
                                        margin:0 !important;

                                        .v-text-field__slot {
                                            font-size: 80% !important;
                                            input {
                                                text-align:center;
                                            }
                                        }
                                        &:before, &:after {
                                                display:none !important;
                                            }
                                    }
                                }
                            }
                        }
                    }
                }

                &.highlight {
                    border:1px solid $orange;
                }
            }
        }

        .rogue_btn {
            position:fixed;
            top:calc(-50vh + 100px);
            left:0px;

            .v-btn {
                border:1px solid #888;
                background:transparent;
                border-radius:0px;
                @include drop_shadow;

                .v-icon {
                    color:whitesmoke;
                }
            }

            &:after {
                content:'';
                position:absolute;
                top:0;
                left:0;
                width:100%;
                height:100%;
                opacity:0.75;
                background:$reversed;
                z-index:-1;
            }
        }
    }
</style>
