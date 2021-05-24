<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'LogosAIT',
    data() {
        return {
          images: {
            logoAIT: require('@/assets/AIT_Logo.png'),
            logoCIL: require('@/assets/cil_logo.png'),
            logoInfrared: require('@/assets/infrared_logo.png'),
          },
          windowWidth: window.innerWidth,
        }
    },
    mounted(){
    },
    updated(){
        //this.renderTimeGraph();
    },
    created(){
        document.onkeydown = this.onkeydown
    },
    components: {},
    methods:{

    },
      computed: {
        ...mapState([
          'activeMenuComponent',
        ]),
        ...generateStoreGetterSetter([
          ]
        )
    },
    watch: {
    }
}

</script>

<template>
    <!--<div v-if="activeMenuComponent === 'AbmScenario'" id="timesheet" :class="{ ui_hide: !showUi || abmData == null }">-->
        <div v-if="activeMenuComponent == 'SunExposureResults' || activeMenuComponent == 'WindScenario'" id="logos_ait">
        <!-- <h3><strong>Operating grade</strong> /over time</h3> -->
        <div>
            <v-row align="center">
              <v-col
                cols="6"
                sm="4"
              >
                <v-img :src="images.logoAIT "height="200" contain>
                </v-img>
              </v-col>

              <v-col
                cols="6"
                sm="4"
              >
                <v-img :src="images.logoCIL" height="150" contain>
                </v-img>
              </v-col>

              <v-col
                cols="6"
                sm="4"
                align-self="center"
              >
                <v-img
                  height="50"
                  contain
                  :src="images.logoInfrared">
                </v-img>
              </v-col>
            </v-row>
        </div>
        </div>
</template>

<style scoped lang="scss">
    @import "../../style.main.scss";

    #logos_ait {
      position: fixed;
      bottom: 10px;
      right: 350px;
      width: auto;
      height: auto;
      max-width: 500px;
      max-height: 150px;
      padding: 10px;

      @media(max-device-width: 720px) {
        max-width: 50vw;
      }
    }

</style>
