<script lang="ts">
import maplibregl, { MapOptions } from "maplibre-gl";
import { mapState } from "vuex";
import amenities from "@/config/abmScenarioSupportLayers/amenitiesLayerConfig";
import { alkisTranslations } from "@/store/abm";
import { generateStoreGetterSetter } from "@/store/utils/generators";
import Contextmenu from "@/components/Menu/Contextmenu.vue";
import { calculateAbmStatsForFocusArea } from "@/store/scenario/abmStats";
import { calculateAmenityStatsForFocusArea } from "@/store/scenario/amenityStats";
import FocusAreasLayer from "@/config/urbanDesignLayers/focusAreasLayerConfig";
import { getUserContentLayerIds } from "@/services/map.service";
import mdiInformationPng from "@/assets/mdi-information.png";
import defaultMapSettings from "@/defaultMapSettings";
import { getLayerIds } from "@/services/layers.service";

export default {
  name: "Map",
  props: {
    restrictedAccess: Boolean,
  },
  data() {
    return {
      lastClicked: [],
      hoveredFocusArea: null,
      modalLayers: ["groundfloor", "upperfloor", "rooftops"],
      restrictedLayers: ["groundfloor", "upperfloor", "rooftops"],
    };
  },
  computed: {
    ...mapState(["map"]),
    ...generateStoreGetterSetter([
      ["selectedObjectId", "selectedObjectId"],
      ["showLegend", "showLegend"],
      ["loader", "scenario/loader"],
      ["selectedFocusAreas", "scenario/selectedFocusAreas"],
      ["updateAbmStatsChart", "scenario/updateAbmStatsChart"],
      ["updateAmenityStatsChart", "scenario/updateAmenityStatsChart"],
      ["openModalsIds", "openModalsIds"],
    ]),

    showLoader: {
      // getter
      get: function () {
        return this.$store.state.scenario.resultLoadingStati.map;
      },
      // setter
      set: function (loadingState) {
        let loadingStati = Object.assign(
          {},
          this.$store.state.scenario.resultLoadingStati
        );
        loadingStati.map = loadingState;
        this.$store.commit("scenario/resultLoadingStati", loadingStati);
      },
    },
  },
  mounted(): void {
    const options = {
      container: "map",
      center: defaultMapSettings.view.center,
      zoom: defaultMapSettings.view.zoom,
      bearing: defaultMapSettings.view.bearing,
      pitch: defaultMapSettings.view.pitch,
      minZoom: defaultMapSettings.minZoom,
      maxZoom: defaultMapSettings.maxZoom,
      style: defaultMapSettings.styleUrl,
    };

    this.$store.state.map = new maplibregl.Map(options as MapOptions);
    this.addInfoIconToMap();

    // Create a popup, but don't add it to the map yet.
    this.popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
    });

    // general map interaction
    this.map.on("load", this.onMapLoaded);
    this.map.on("click", this.onMapClicked);

    // amenities layer
    this.map.on("mousemove", "abmAmenities", this.onAmenitiesHover);
    this.map.on("mouseleave", "abmAmenities", this.onAmenitiesHoverLeave);

    // focus areas layer
    this.map.on("mousemove", "focusAreas", this.onFocusAreaHover);
    this.map.on("mouseleave", "focusAreas", this.onFocusAreaLeave);

    // images
    this.map.on("styleimagemissing", this.notifyMissingImage);
  },
  methods: {
    addInfoIconToMap() {
      const map = this.$store.state.map;
      map.loadImage(mdiInformationPng, function (error, image) {
        if (error) throw error;
        map.addImage("mdi-information", image);
      });
    },
    recordEventPosition(evt: MouseEvent): void {
      console.log("recordEventPosition clicked: ", evt);

      this.lastClicked = [];
      this.lastClicked[0] = (evt.clientX * 100) / window.innerWidth / 100;
      this.lastClicked[1] = (evt.clientY * 100) / window.innerHeight / 100;
      this.$store.commit("scenario/lastClick", this.lastClicked);
    },
    onMapClicked(evt: maplibregl.MapMouseEvent): void {
      console.debug("click!", evt);
      this.recordEventPosition(evt.originalEvent);
      const bbox: [[number, number], [number, number]] = [
        [evt.point.x - 10, evt.point.y - 10],
        [evt.point.x + 10, evt.point.y + 10],
      ];
      const features = (this.map as maplibregl.Map).queryRenderedFeatures(
        bbox,
        {
          layers: getUserContentLayerIds(this.map).filter((layerId) => {
            return this.map.getLayer(layerId);
          }),
        }
      );

      if (Array.isArray(features) && features.length > 0) {
        this.actionForClick(features);
      }
    },
    actionForClick(clickedFeatures): void {
      const initialFeature = clickedFeatures[0];
      const initialLayerId = initialFeature.layer.id;

      // calculate stats for focus area
      if (getLayerIds(FocusAreasLayer.layerConfigs).includes(initialLayerId)) {
        this.onFocusAreaClick(initialFeature.id);
        return;
      }

      // open/close a modal
      if (this.modalLayers.indexOf(initialLayerId) > -1) {
        if (
          // TODO handle restricted access somewhere else
          this.restrictedAccess &&
          this.restrictedLayers.indexOf(initialLayerId) > -1
        ) {
          console.warn("feature not available for restricted users.");
          return;
        }
        this.handleModal(initialFeature);
        return;
      }

      // do nothing for this layer, but try to find action for the next layer in the stack
      clickedFeatures.shift(); // remove initial feature
      if (clickedFeatures.length > 0) {
        this.actionForClick(clickedFeatures);
      }
    },
    /* opens or closes modal */
    handleModal(initialFeature) {
      this.selectedObjectId = initialFeature.properties["city_scope_id"];

      if (this.openModalsIds.indexOf(this.selectedObjectId) !== -1) {
        console.log("closing modal ", this.selectedObjectId);
        this.$modal.hide(this.selectedObjectId);

        return;
      }

      // create new modal
      this.createModal();
    },
    onMapLoaded() {
      console.log("create design layers");
      this.showLoader = true;
      this.$store.dispatch("createDesignLayers").then(() => {
        this.showLoader = false;
      });
      this.$store.dispatch("addFocusAreasMapLayer");
    },
    createModal() {
      this.openModalsIds.push(this.selectedObjectId);
      this.$modal.show(
        // pass arguments to context menu
        Contextmenu,
        {},
        {
          name: this.selectedObjectId,
          draggable: window.innerWidth >= 1024 ? true : false,
          width: 280,
          adaptive: true,
          shiftX: this.lastClicked[0] + 0.125,
          shiftY: this.lastClicked[1] + 0.125,
        }
      );
    },
    onAmenitiesHover(evt) {
      this.map.getCanvas().style.cursor = "pointer";

      const coordinates = evt.features[0].geometry.coordinates.slice();
      const alkisId = evt.features[0].properties.GFK;
      const description = alkisTranslations[alkisId] || alkisId;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(evt.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += evt.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // Populate the popup and set its coordinates
      // based on the feature found.
      this.popup.setLngLat(coordinates).setHTML(description).addTo(this.map);
    },
    onAmenitiesHoverLeave(evt) {
      console.log("leaving layer");
      this.map.getCanvas().style.cursor = "";
      this.popup.remove();
    },
    onFocusAreaHover(evt) {
      if (evt.features.length > 0) {
        if (this.hoveredFocusArea) {
          this.map.setFeatureState(
            { source: "focusAreas", id: this.hoveredFocusArea },
            { hover: false }
          );
        }
        this.hoveredFocusArea = evt.features[0].id;

        this.map.setFeatureState(
          { source: "focusAreas", id: this.hoveredFocusArea },
          { hover: true }
        );
      }
    },
    onFocusAreaLeave(evt) {
      if (this.hoveredFocusArea) {
        this.map.setFeatureState(
          { source: "focusAreas", id: this.hoveredFocusArea },
          { hover: false }
        );
      }
      this.hoveredFocusArea = null;
    },
    onFocusAreaClick(selectedFocusArea) {
      console.log("click focus area");
      const idx = this.selectedFocusAreas.indexOf(selectedFocusArea);
      if (idx > -1) {
        // if area already selected -> deselect focus area
        this.selectedFocusAreas.splice(idx, 1);
        this.map.setFeatureState(
          { source: "focusAreas", id: selectedFocusArea },
          { clicked: false, hover: false }
        );
        // update charts
        this.updateAbmStatsChart = true;
        this.updateAmenityStatsChart = true;
      } else {
        // add to selected areas
        this.selectedFocusAreas.push(selectedFocusArea);
        this.map.setFeatureState(
          { source: "focusAreas", id: selectedFocusArea },
          { clicked: true, hover: false }
        );
        // compute results.
        calculateAmenityStatsForFocusArea(selectedFocusArea);
        calculateAbmStatsForFocusArea(selectedFocusArea);
      }
    },
    notifyMissingImage(error) {
      const imgName = error.id; // id of the missing image
      console.error("Please add your image to the map", imgName);
    },
  },
};
</script>

<template>
  <div id="map" ref="map"></div>
</template>

<style scoped lang="scss">
#map {
  height: 100%;
  width: 100%;
}
</style>
