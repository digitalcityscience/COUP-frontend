<script>
import { mapState } from "vuex";
import { generateStoreGetterSetter } from "@/store/utils/generators";

export default {
  name: "LogosAIT",
  data() {
    return {
      images: {
        logoAIT: require("@/assets/AIT_Logo_new.png"),
        logoCIL: require("@/assets/cil_logo_new.png"),
        logoInfrared: require("@/assets/infrared_logo_new.png"),
        logoAitMobile: require("@/assets/AIT_Logo_mobile.png"),
        logoCilMobile: require("@/assets/cil_logo_mobile.png"),
        logoInfraredMobile: require("@/assets/infrared_logo_mobile.png"),
      },
    };
  },
  created() {
    document.onkeydown = this.onkeydown;
  },
  components: {},
  methods: {},
  computed: {
    ...mapState(["activeMenuComponent"]),
    ...generateStoreGetterSetter([]),
    windowWidth() {
      return this.$vuetify.breakpoint.width;
    },
  },
  watch: {},
};
</script>

<template>
  <div
    v-if="
      activeMenuComponent == 'SunExposureResults' ||
      activeMenuComponent == 'WindScenario'
    "
    id="logos_ait"
  >
    <div v-if="windowWidth >= 600">
      <v-row>
        <v-col cols="6" sm="4">
          <v-img :src="images.logoAIT"></v-img>
        </v-col>

        <v-col cols="6" sm="4">
          <v-img :src="images.logoCIL"> </v-img>
        </v-col>

        <v-col cols="6" sm="4">
          <v-img :src="images.logoInfrared"> </v-img>
        </v-col>
      </v-row>
    </div>
    <!-- MOBILE IMAGE VERSIONS -->
    <div v-else>
      <v-row>
        <v-col cols="4" sm="2">
          <v-img
            :src="images.logoAitMobile"
            contain
            height="20"
            self-align="end"
          ></v-img>
        </v-col>

        <v-col cols="4" sm="2">
          <v-img
            :src="images.logoCilMobile"
            contain
            height="20"
            self-align="end"
          ></v-img>
        </v-col>

        <v-col cols="4" sm="2">
          <v-img
            :src="images.logoInfraredMobile"
            contain
            height="20"
            self-align="end"
            style="margin-left: -15px"
          ></v-img>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

#logos_ait {
  position: fixed;
  bottom: 0px;
  right: 300px;
  width: auto;
  height: auto;
  max-width: 500px;
  max-height: 150px;
  padding: 10px;

  @media (max-device-width: 1023px) {
    //display: none;
    right: 20px;
    width: 50vw;
  }

  @media (max-device-width: 600px) {
    bottom: -10px;
    width: 30vh;
  }
}
</style>
