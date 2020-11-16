<script>
import { mapState } from 'vuex'
import {generateStoreGetterSetter} from "@/store/utils/generators";
import UseTypesLegend from "@/components/Menu/UseTypesLegend.vue";

export default {
    name: 'Viewbar',
    components: { UseTypesLegend },
    data() {
        return {
            toggleFeatures: false,
            toggleSlider: false,
            brightness:1,
            showUi: true,
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
            'layerIds',
            'selectedFeatures',
            'selectedMultiFeatures',
        ]),
      ...generateStoreGetterSetter([
        ['allFeaturesHighlighted', 'allFeaturesHighlighted' ],
        ['showLegend', 'showLegend' ]
      ]),
      workshop(){
          return this.$store.state.workshop;
      }
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
            if(this.allFeaturesHighlighted){
                this.allFeaturesHighlighted = false;
                const featuresToRemove = this.selectedMultiFeatures;

                featuresToRemove.forEach(feature => {
                    feature.properties.selected = "inactive";
                    this.$store.dispatch('editFeatureProps', feature);
                })

            } else {
                this.allFeaturesHighlighted = true;
                this.openUseTypesLegend();

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
         <v-btn v-if="allFeaturesHighlighted"  @click="openUseTypesLegend" v-bind:class="{ highlight: showLegend }"><v-tooltip right>
             <template v-slot:activator="{ on, attrs }">
               <v-icon
                 v-bind="attrs"
                 v-on="on"
               >mdi-map-legend</v-icon>
             </template>
             <span>Use Types Legend</span>
           </v-tooltip>
           </v-btn>
         <v-btn v-if="!workshop" @click="highlightAllFeatures" v-bind:class="{ highlight: allFeaturesHighlighted }"><v-tooltip right>
           <template v-slot:activator="{ on, attrs }">
             <v-icon
               v-bind="attrs"
               v-on="on"
             >mdi-city</v-icon>
           </template>
           <span>Highlight All Buildings</span>
         </v-tooltip>
         </v-btn>
           <v-btn class="light_view" v-bind:class="{ highlight: toggleSlider }" @click="toggleSlider = !toggleSlider"> <v-tooltip right>
                 <template v-slot:activator="{ on, attrs }">
                   <v-icon
                     v-bind="attrs"
                     v-on="on"
                   >mdi-lightbulb-on-outline</v-icon>
                 </template>
                 <span>Adjust Brightness</span>
               </v-tooltip>
                <div class="popup_cnt" v-if="toggleSlider">
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

                .v-icon {
                    font-size:18px;
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
