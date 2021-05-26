<script>
import { mapState } from 'vuex'
import Chart from 'chart.js'
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'LogosAIT',
    data() {
        return {
          images: {
            logoAIT: require('@/assets/AIT_Logo_new.png'),
            logoCIL: require('@/assets/cil_logo_new.png'),
            logoInfrared: require('@/assets/infrared_logo_new.png')
          },
          windowWidth: window.innerWidth,
        }
    },
    mounted(){
    },
    updated(){
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
            <v-row align="end" no-gutters>
              <v-col
                cols="6"
                sm="4"
              >
                <v-img :src="images.logoAIT "height="105" contain>
                </v-img>
              </v-col>

              <v-col
                cols="6"
                sm="4"
              >
                <v-img :src="images.logoCIL" height="105" contain>
                </v-img>
              </v-col>

              <v-col
                cols="6"
                sm="4"
                align-self="end"
              >
                <v-img
                  style="margin-left: -10%;"
                  height="105"
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
      right: 300px;
      width: auto;
      height: auto;
      max-width: 500px;
      max-height: 150px;
      padding: 10px;

      @media(max-device-width: 720px) {
        max-width: 30vw;
      }
    }

</style>
