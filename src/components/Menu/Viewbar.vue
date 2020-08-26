<script>
import { mapState } from 'vuex'

export default {
    name: 'Viewbar',
    components: {},
    data() {
        return {
            activeComponent: 'AbmScenario',
            toggleSlider: false,
            brightness:1,
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
    },
    methods:{
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
        }
    }
}
</script>

<template>
   <div id="viewbar">
       <div class="button_bar">
           <v-btn class="light_view" v-bind:class="{ highlight: toggleSlider }" @click="toggleSlider = !toggleSlider"><v-icon>mdi-lightbulb-on-outline</v-icon>
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
           <v-btn class="reset_view" @click="resetView"><v-icon>mdi-crosshairs-gps</v-icon></v-btn>
        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    #viewbar {
        position:fixed;
        right:31vw;
        bottom:10px;
        width:auto;
        background:transparent;

        .button_bar {
            .v-btn {
                width:40px;
                min-width:0px;
                height:30px;
                margin:0px 2px;
                background:rgba(255,255,255,0.9);
                @include drop_shadow;

                .v-icon {
                    font-size:18px;
                }

                .popup_cnt {
                    position:absolute;
                    bottom:34px;
                    right:-12px;
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

        @media(min-device-width:1080px) {
            right:345px;
        }
    }
</style>
