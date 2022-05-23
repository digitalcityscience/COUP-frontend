<script>
import { mapState } from "vuex";
import * as turf from "@turf/turf";
import { generateStoreGetterSetter } from "@/store/utils/generators";
import {
  areBuildingUsesColored,
  showBuildingUseColors,
  hideBuildingUseColors,
} from "@/services/map.service";
import BuildingsLegend from "@/components/Menu/viewbar/BuildingsLegend.vue";

export default {
  name: "Contextmenu",
  components: {
    BuildingsLegend,
  },
  data() {
    return {
      lineCanvasId: null,
      active: false,
      indexVal: 0,
      modalDiv: "",
      dragging: false,
      windowWidth: window.innerWidth,
      objectFeatures: [],
      objectId: null,
      modalInfo: {},
      keepBuildingColors: false,
    };
  },
  computed: {
    ...generateStoreGetterSetter([
      ["openModalsIds", "openModalsIds"],
      ["modalIndex", "modalIndex"],
    ]),

    map() {
      return this.$store.state.map;
    },

    // city_scope_id of the clicked object (set in Map.vue, onMapClick)
    selectedObjectId() {
      return this.$store.state.selectedObjectId;
    },
  },
  beforeMount() {
    if (!this.selectedObjectId) {
      console.log("Tried to open modal, but no selectedObjectId given");
      return;
    }

    // new object selected, circleObject and create modal
    this.objectId = this.selectedObjectId.toString(); // disconnect from store
    this.createObjectFeatures();
    this.gatherModalInfo();
    this.toggleFeatureCircling();

    if (areBuildingUsesColored(this.map)) {
      // buildings have already been colored when initiating modal
      this.keepBuildingColors = true;
    } else {
      showBuildingUseColors(this.map);
    }
  },
  mounted() {
    let selector = this.$el;
    this.modalDiv = selector.closest(".vm--modal");
    this.selectedModal();

    if (window.innerWidth >= 1024) {
      this.sleep(300).then(() => {
        this.createLineOnCanvas();
      });
    }

    this.active = true;

    if (window.innerWidth >= 1024) {
      this.map.on("drag", this.createLineOnCanvas);
      this.map.on("zoom", this.createLineOnCanvas);
      this.map.on("rotate", this.createLineOnCanvas);
    }
    window.addEventListener("mouseup", this.stopDrag);
  },
  beforeDestroy() {
    this.toggleFeatureCircling();

    if (!this.keepBuildingColors) {
      hideBuildingUseColors(this.map);
    }

    // remove line on canvas connecting modal to selected feature
    const canvas = document.getElementById(this.lineCanvasId);
    canvas.remove();
    this.active = false;

    this.openModalsIds.splice(
      this.openModalsIds.indexOf(this.selectedObjectId),
      1
    );
  },
  methods: {
    createObjectFeatures() {
      const renderedFeatures = this.map.queryRenderedFeatures();
      this.objectFeatures = renderedFeatures.filter((feat) => {
        return feat.properties["city_scope_id"] === this.objectId;
      });
    },
    getLayerHeadline(layerName) {
      const headlines = {
        groundfloor: "Groundfloor",
        upperfloor: "Upper Floors",
        rooftop: "Rooftop",
      };

      return headlines[layerName];
    },

    gatherModalInfo() {
      this.modalInfo = {
        objectType: "",
        generalContent: [], // [{ propTitle: propValue}, ..]}
        detailContent: {}, // header : [{ propTitle: propValue}]}
      };

      // iterate over objects features and add modal info, depending on feature layer or type
      this.objectFeatures.forEach((feature, i, a) => {
        const layerId = feature.layer.id;
        switch (layerId) {
          case "groundfloor":
            this.modalInfo["objectType"] = "building";
            this.modalInfo["coords"] = turf.centroid(
              turf.polygon(feature.geometry.coordinates)
            ).geometry.coordinates;
            this.modalInfo["generalContent"].push({
              "Building ID": feature.properties["building_id"],
            });
            this.addBuildingFloorInfo(feature);
            break;
          case "rooftop":
            // add also roof type here when available
            this.addBuildingFloorInfo(feature);
            break;
          case "upperfloor":
            this.addBuildingFloorInfo(feature);
            this.modalInfo["generalContent"].push({
              "Building Height":
                feature.properties["building_height"].toString() + "m",
            });
            break;
        }
      });
    },
    addBuildingFloorInfo(feature, floorType) {
      this.modalInfo["detailContent"][feature.layer.id] = [
        { Use: feature.properties.land_use_detailed_type },
        { "Suggested Use Detail": feature.properties["land_use_suggested"] },
      ];

      if (feature.layer.id === "groundfloor") {
        this.modalInfo["detailContent"][feature.layer.id].push({
          "Gross Floor Area":
            Math.round(feature.properties["floor_area"]).toString() + "m²",
        });
      }

      if (feature.layer.id === "upperfloor") {
        const upperFloorsCount = feature.properties["number_of_stories"] - 1;
        // if upperfloors count is specified, provide more info
        if (upperFloorsCount) {
          this.modalInfo["detailContent"][feature.layer.id].push(
            { "Upper Floors Count": upperFloorsCount },
            {
              "Gross Floor Area":
                Math.floor(
                  upperFloorsCount * feature.properties["floor_area"]
                ) + "m²",
            }
          );
        }
      }
    },
    //** circles or uncircles clickedFeatures */
    toggleFeatureCircling() {
      let buffer = null;

      console.log("features", this.objectFeatures);

      // find geometry to create circle around the object
      this.objectFeatures.every((feature) => {
        if (feature.layer.id === "groundfloor") {
          buffer = turf.buffer(
            turf.polygon(feature.geometry.coordinates),
            0.015
          );
          // if a ground floor found: jump out - it is the perfect geometry for circling a building
          return false;
        }
        if (feature.layer.id === "upperfloor") {
          buffer = turf.buffer(
            turf.polygon(feature.geometry.coordinates),
            0.015
          );
          // if a upper floor found: take as fallback geometry for circling.
          return true;
        }

        return true;
      });
      // update circled features
      buffer.properties["objectId"] = this.objectId;
      this.$store.dispatch("updateCircledFeaturesLayer", buffer);
    },
    getProjectedObjectCoords() {
      return this.map.project(this.modalInfo["coords"]);
    },
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },
    selectedModal() {
      this.modalIndex += 1;
      let selector = this.$el;
      let targetModal = selector.closest(".vm--container");
      targetModal.style.zIndex = this.modalIndex;
    },
    /** creates a line on canvas connecting the modal box to it's object as anchor */
    createLineOnCanvas() {
      if (window.innerWidth >= 1024) {
        if (this.active) {
          this.lineCanvasId = "line_" + this.objectId;
          const boxContainer = document.getElementById("line_canvas");
          if (document.getElementById(this.lineCanvasId)) {
            // remove existing line container
            boxContainer.removeChild(
              document.getElementById(this.lineCanvasId)
            );
          }

          // create canvas
          let canvas = document.createElement("canvas");
          canvas.id = this.lineCanvasId;
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          canvas.style.position = "absolute";
          boxContainer.appendChild(canvas);
          var context = canvas.getContext("2d");

          const projectedObjectCoords = this.getProjectedObjectCoords();
          const anchorConnnection = {
            x: projectedObjectCoords.x,
            y: projectedObjectCoords.y,
          };

          const boxConnection = {};
          boxConnection.x =
            parseInt(this.modalDiv.style.left, 10) +
            this.modalDiv.getBoundingClientRect().width / 2;
          boxConnection.y =
            parseInt(this.modalDiv.style.top, 10) +
            this.modalDiv.getBoundingClientRect().height / 2;

          context.canvas.width = window.innerWidth;
          context.canvas.height = window.innerHeight;
          context.beginPath();
          context.lineWidth = "1";
          context.strokeStyle = "#FEE351";
          context.moveTo(
            Math.round(boxConnection.x),
            Math.round(boxConnection.y)
          );
          context.lineTo(
            Math.round(anchorConnnection.x),
            Math.round(anchorConnnection.y)
          );
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
    },
  },
};
</script>

<template>
  <span>
    <div
      class="ctx_menu"
      @click="selectedModal()"
      @mousedown="startDrag"
      @mousemove="doDrag"
      v-bind:style="{ zIndex: indexVal }"
    >
      <div class="wrapper">
        <div class="ctx_bar">
          <v-icon size="18px">mdi-city</v-icon>
          <p>{{ modalInfo.objectType.toUpperCase() }} - {{ objectId }}</p>
          <div class="close_btn" @click="$emit('close')">
            <v-icon>mdi-close</v-icon>
          </div>
        </div>
        <div
          class="general"
          v-for="(item, index) in modalInfo.generalContent"
          :key="index"
        >
          <p></p>
          <div v-for="(value, key) in item" :key="key">
            <p>{{ key }} : {{ value }}</p>
          </div>
        </div>
      </div>
      <div
        class="head_scope"
        v-for="(content, name) in modalInfo.detailContent"
        :key="name"
      >
        <div class="head_bar">
          <h3>{{ getLayerHeadline(name) }}</h3>
        </div>
        <div v-for="ctx in content" :key="ctx.key">
          <div v-for="(value, key) in ctx" :key="key">
            <p>
              <strong>{{ key }}</strong> {{ value }}
            </p>
          </div>
        </div>
      </div>
    </div>
    <BuildingsLegend class="buildings-legend" />
  </span>
  <!--<svg class="connection"><line :x1="Math.round(anchorConnnection.x)" :y1="Math.round(anchorConnnection.y)" :x2="Math.round(boxConnection.x)" :y2="Math.round(boxConnection.y)" stroke-width="1px" stroke="white"/></svg>-->
</template>

<style scoped lang="scss">
@import "../../style.main.scss";

.ctx_menu {
  position: relative;
  //position:fixed;
  width: 280px;
  //min-height:200px;
  background: rgba(0, 0, 0, 0.75);
  max-width: 100%;
  padding: 5px;
  border: 1px solid #fee351;
  box-sizing: border-box;
  @include drop_shadow;

  p {
    color: whitesmoke;
    font-size: 100%;
    strong {
      font-size: 80%;
      color: #ddd;
    }
  }

  .ctx_bar {
    position: relative;
    display: flex;
    width: 100%;
    height: 30px;
    line-height: 30px;
    background: $reversed;
    padding: 0px 5px;

    .v-icon {
      opacity: 1;
      filter: invert(1);
      flex: 0 0 35px;
    }

    .close_btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 30px;
      height: 30px;
      border: 2px solid white;

      .v-icon {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: black;
        font-size: 15px;
      }
    }

    &:hover {
      cursor: pointer;
    }
  }

  .general {
    padding: 5px;
    box-sizing: border-box;

    p {
      font-size: 80%;
      color: whitesmoke;
      font-weight: 300;
    }
  }

  .head_scope {
    width: 90%;
    margin: 5px auto;
    color: whitesmoke;
    border: 1px solid #444;
    box-sizing: border-box;
    font-size: 80%;

    .head_bar {
      position: relative;
      margin: 5px auto;
      padding: 0px 10px;
      box-sizing: border-box;
      width: 95%;
      height: 30px;
      line-height: 30px;
      font-size: 100%;
      z-index: 3;
      //background:linear-gradient(45deg, $red, transparent);
      @include drop_shadow;

      &:after {
        @include fullpseudo;
        background: $greyblue;
        opacity: 0.75;
        z-index: -1;
      }

      h3 {
        color: whitesmoke;
        font-size: 100%;
        font-weight: 300;
      }
    }

    p {
      border-top: 1px solid #444;
      padding: 2px 10px;
      box-sizing: border-box;
      &:first-child {
        border: none;
      }
    }
  }

  .warn {
    color: darkred;
    margin-top: 10px;
  }

  &:hover {
    border: 1px solid $orange;
    background: rgba(0, 0, 0, 0.95);
  }

  @media (max-device-width: 1023px) {
    position: fixed;
    width: 80%;
    max-width: 400px;
    min-height: 50vh;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px) saturate(180%);
  }
}
</style>
