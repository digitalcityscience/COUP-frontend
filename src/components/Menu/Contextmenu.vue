<script>
import { mapState } from 'vuex'
import * as turf from '@turf/turf'
import store from "@/store";
import Trips from "@/assets/trips.json"
import Amenities from "@/assets/amenities.json"
import {alkisTranslations} from "@/store/abm";


export default {
    name: 'Contextmenu',
    components: {},
    data() {
        return {
            objInfo: null,
            objType:'',
            objId:'',
            objGFA:'',
            amenityCtxInfo: {},
            active: false,
            objectData:[],
            indexVal:0,
            myFeatures:[],
            Coords:[],
            Coordinates:[],
            isMe:'',
            buildingConnection:{},
            boxConnection:{},
            line:'',
            dragging: false,
            horizontalLine:{},
            verticalLine:{},
            matchingPoint:{},
            matchingLine:{},
            buildingLine:{},
            windowWidth: window.innerWidth,
            asOrigin:false,
            asDestination:false
        }
    },
    computed: {
      ...mapState([
        'allFeaturesHighlighted',
        'map',
        ]),
        clickPosition(){
            return this.$store.state.scenario.lastClick;
        },
        modalInfo() {
          return this.$store.state.modalInfo;
        },
        features(){
            return this.$store.state.selectedFeatures;
        },
        modalIndex(){
            return this.$store.state.scenario.modalIndex;
        },
        abmTrips(){
            return this.$store.state.scenario.abmTrips;
        }
    },
    beforeMount(){
        this.objInfo = JSON.parse(JSON.stringify(this.modalInfo))
        console.log("before mount")
        console.log("highlight")
        //this.highlight()
        //this.checkPositions();
    },
    mounted(){
        let selector = this.$el;
        this.isMe = selector.closest(".vm--modal");
        this.myFeatures = this.features;
        this.selectedModal();

        if(this.myFeatures[0].properties["objectType"] === "building" && window.innerWidth >= 1024){
            // only for buildings
            this.highlightSelectedFeatures();
            this.sleep(300).then(() => { this.createLineOnCanvas(); });
        }

        console.log("this is me")
        console.log(this.isMe)

        this.active = true;

        if(window.innerWidth >= 1024){
            this.map.on('drag', this.updateBuildingMarks);
            this.map.on('zoom', this.updateBuildingMarks);
            this.map.on('rotate', this.updateBuildingMarks);
            this.map.on('drag', this.checkPositions);
            this.map.on('zoom', this.checkPositions);
            this.map.on('rotate', this.checkPositions);
        }
        window.addEventListener('mouseup', this.stopDrag);
       /* ctxMenu.style.top = this.clickPosition[0] + 10 + "px";
        ctxMenu.style.left = this.clickPosition[1] + 10 + "px";*/
    },
    updated(){
        //this.checkPositions();
    },
    beforeDestroy() {
      if (!this.allFeaturesHighlighted) {
        const newFeature = this.myFeatures;
        newFeature.forEach(feature => {
            feature.properties.selected = "inactive";
            this.$store.dispatch('editFeatureProps', feature)
        });
      }

        // const canvas = document.getElementById(this.objId);
       // todo const building_canvas = document.getElementById(this.objId + '-building');
        // not used ? var context = canvas.getContext('2d');
        //context.clearRect(0, 0, canvas.width, canvas.height);
        //canvas.remove();
        // todo building_canvas.remove();
        this.active = false;
    },
    methods:{
        beforeOpen (event) {
          console.log("take info from hereß?")
          console.log(event)
        },
        /** todo raus hier*/
        updateTrips(objectData, originOrDestination) {
          console.log("objectData")
          console.log(objectData)
          console.log("originOrDestination")
          console.log(originOrDestination)

          const amenityPoint = this.Coordinates

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
            this.$store.commit('scenario/modalIndex', this.indexVal);
        },
        createLineOnCanvas(){
            //this.buildingConnection = this.map.project(this.Coords);
            this.buildingConnection = {
                    x: this.Coords[0],
                    y: this.Coords[1],
            }
            this.boxConnection.x = parseInt(this.isMe.style.left, 10) + this.isMe.getBoundingClientRect().width/2;
            this.boxConnection.y = parseInt(this.isMe.style.top, 10) + this.isMe.getBoundingClientRect().height/2;
            const boxContainer = document.getElementById("line_canvas");
            var canvas = document.createElement('canvas');

            canvas.id = this.objId;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = "absolute";

            boxContainer.appendChild(canvas);
            var context = canvas.getContext('2d');

            context.canvas.width  = window.innerWidth;
            context.canvas.height = window.innerHeight;
            context.beginPath();
            context.lineWidth="1";
            context.strokeStyle="#FEE351";
            context.moveTo(Math.round(this.boxConnection.x), Math.round(this.boxConnection.y));
            context.lineTo(Math.round(this.buildingConnection.x), Math.round(this.buildingConnection.y));
            context.stroke();

        },
        createBuildingMarks(){
            if (!(this.objType === "building")) {
              // TODO refactor drawing of building marks by making it a layer with lat/long coords of building buffer
              return
            }
            const boxContainer = document.getElementById("line_canvas");
            var canvas = document.createElement('canvas');
            var coordinates = this.Coordinates;
            coordinates = coordinates.map(x => this.map.project(x));
            canvas.id = this.objId + "-building";
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = "absolute";

            boxContainer.appendChild(canvas);
            var context = canvas.getContext('2d');
            context.canvas.width  = window.innerWidth;
            context.canvas.height = window.innerHeight;
            context.beginPath();
            context.lineWidth="2";
            context.strokeStyle="#FEE351";
            context.moveTo(Math.round(coordinates[0].x), Math.round(coordinates[0].y));
            var i;
            for (i = 1; i < coordinates.length; i++) {
                context.lineTo(Math.round(coordinates[i].x), Math.round(coordinates[i].y));
            }

            context.stroke();
            console.log(coordinates);
            this.Coords = this.buildingCenter(coordinates);
            console.log(this.Coords);

        },
        highlight() {
          let featureData = turf.featureCollection(this.features.map(feature => {
            console.log(feature.geometry.type)
            if (feature.geometry.type === "Point") {
              let buffer = turf.buffer(turf.point(feature), 0.005)
              feature.geometry = buffer.geometry
            }
            return feature
          }))

          console.log("geojson?")
          console.log(JSON.parse(JSON.stringify(featureData)))

          this.$store.dispatch("addCircledFeaturesLayer", featureData.features)
        },
        updateBuildingMarks(){
          if (!(this.objType === "building")) {
            // TODO refactor drawing of building marks by making it a layer with lat/long coords of building buffer
            return
          }
            if(this.active){
                var coordinates = this.Coordinates;
                coordinates = coordinates.map(x => this.map.project(x));
                this.Coords = this.buildingCenter(coordinates);

                const canvas = document.getElementById(this.objId + "-building");
                var context = canvas.getContext('2d');
                context.canvas.width  = window.innerWidth;
                context.canvas.height = window.innerHeight;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.lineWidth="2";
                context.strokeStyle="#FEE351";
                context.moveTo(Math.round(coordinates[0].x), Math.round(coordinates[0].y));
                for (var i = 1; i < coordinates.length; i++) {
                    context.lineTo(Math.round(coordinates[i].x), Math.round(coordinates[i].y));
                }

                context.stroke();
            }
        },
        buildingCenter(arr){
            var minX, maxX, minY, maxY;
            for (var i = 0; i < arr.length; i++){
                minX = (arr[i].x < minX || minX == null) ? arr[i].x : minX;
                maxX = (arr[i].x > maxX || maxX == null) ? arr[i].x : maxX;
                minY = (arr[i].y < minY || minY == null) ? arr[i].y : minY;
                maxY = (arr[i].y > maxY || maxY == null) ? arr[i].y : maxY;
            }
            return [(minX + maxX) / 2, (minY + maxY) / 2];
        },
        checkPositions(){
          if (!(this.objType === "building")) {
            // TODO refactor drawing of building marks by making it a layer with lat/long coords of building buffer
            return
          }
            if(window.innerWidth >= 1024) {
                if(this.active){
                    this.boxConnection.x = this.isMe.getBoundingClientRect().left + this.isMe.getBoundingClientRect().width/2;
                    this.boxConnection.y = this.isMe.getBoundingClientRect().top + this.isMe.getBoundingClientRect().height/2;

                    //this.buildingConnection = this.map.project(this.Coords);
                    this.buildingConnection = {
                        x: this.Coords[0],
                        y: this.Coords[1],
                    }

                    var coordinates = this.Coordinates;
                    coordinates = coordinates.map(x => this.map.project(x));
                    var allLines = [];
                    for (var i = 0; i < coordinates.length; i++) {
                        var ii = i + 1;

                    if(ii >= coordinates.length){
                            ii = 0;
                        }

                        //Math.round(coordinates[i].x), Math.round(coordinates[i].y);
                        var check = this.lineIntersection(coordinates[i].x, coordinates[i].y, coordinates[ii].x, coordinates[ii].y, this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y);
                        if(check){
                            this.buildingLine = {
                                x1: coordinates[i].x,
                                y1: coordinates[i].y,
                                x2: coordinates[ii].x,
                                y2: coordinates[ii].y
                            }
                        }
                    }

                    console.log(this.buildingLine);
                    const canvas = document.getElementById(this.objId);
                    var context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.beginPath();
                    context.lineWidth="1";
                    context.strokeStyle="#FEE351";
                    //context.moveTo(this.boxConnection.x, this.boxConnection.y);

                    this.checkMatchingLines();
                    context.moveTo(this.lineIntersection(this.matchingLine.x1,this.matchingLine.y1,this.matchingLine.x2,this.matchingLine.y2,this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).x, this.lineIntersection(this.matchingLine.x1,this.matchingLine.y1,this.matchingLine.x2,this.matchingLine.y2,this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).y);
                    //context.lineTo(Math.round(this.buildingConnection.x), Math.round(this.buildingConnection.y));
                    context.lineTo(this.lineIntersection(this.buildingLine.x1, this.buildingLine.y1, this.buildingLine.x2, this.buildingLine.y2, this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).x, this.lineIntersection(this.buildingLine.x1, this.buildingLine.y1, this.buildingLine.x2, this.buildingLine.y2, this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).y);
                    context.stroke();

                    var pointSize = 3;
                    context.fillStyle = "#FEE351";
                    context.beginPath();
                    context.arc(this.lineIntersection(this.matchingLine.x1,this.matchingLine.y1,this.matchingLine.x2,this.matchingLine.y2,this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).x, this.lineIntersection(this.matchingLine.x1,this.matchingLine.y1,this.matchingLine.x2,this.matchingLine.y2,this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y).y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
                    context.fill();
                }
            }
        },
        checkMatchingLines(){
            if(this.boxConnection.x < this.buildingConnection.x){
                    this.verticalLine = [
                        {
                            x: this.isMe.getBoundingClientRect().right,
                            y: this.isMe.getBoundingClientRect().top,
                        },
                        {
                            x: this.isMe.getBoundingClientRect().right,
                            y: this.isMe.getBoundingClientRect().bottom
                        }
                    ]
                } else {
                    this.verticalLine = [
                        {
                            x: this.isMe.getBoundingClientRect().left,
                            y: this.isMe.getBoundingClientRect().top,
                        },
                        {
                            x: this.isMe.getBoundingClientRect().left,
                            y: this.isMe.getBoundingClientRect().bottom
                        }
                    ]
                }

                if(this.boxConnection.y > this.buildingConnection.y){
                    this.horizontalLine = [
                        {
                            x: this.isMe.getBoundingClientRect().left,
                            y: this.isMe.getBoundingClientRect().top,
                        },
                        {
                            x: this.isMe.getBoundingClientRect().right,
                            y: this.isMe.getBoundingClientRect().top
                        }
                    ]
                } else {
                    this.horizontalLine = [
                        {
                            x: this.isMe.getBoundingClientRect().left,
                            y: this.isMe.getBoundingClientRect().bottom,
                        },
                        {
                            x: this.isMe.getBoundingClientRect().right,
                            y: this.isMe.getBoundingClientRect().bottom,
                        }
                    ]
                };


                if(this.lineIntersection(this.horizontalLine[0].x,this.horizontalLine[0].y,this.horizontalLine[1].x,this.horizontalLine[1].y,this.boxConnection.x, this.boxConnection.y, this.buildingConnection.x, this.buildingConnection.y)){
                    this.matchingLine = {
                        x1: this.horizontalLine[0].x,
                        y1: this.horizontalLine[0].y,
                        x2: this.horizontalLine[1].x,
                        y2: this.horizontalLine[1].y,
                    }
                } else {
                    this.matchingLine = {
                        x1: this.verticalLine[0].x,
                        y1: this.verticalLine[0].y,
                        x2: this.verticalLine[1].x,
                        y2: this.verticalLine[1].y,
                    }
                }

                /*this.verticalLine.forEach(point => {
                    this.horizontalLine.forEach(ppoint => {
                        if(JSON.stringify(point) === JSON.stringify(ppoint)){
                            this.matchingPoint = point;
                        }
                    })
                })

                console.log(this.matchingPoint);*/

                /*if(Math.abs((this.buildingConnection.x - this.matchingPoint.x)/(this.buildingConnection.y - this.matchingPoint.y)) < Math.abs((this.buildingConnection.x - this.boxConnection.x)/(this.buildingConnection.y - this.boxConnection.y))){
                    this.matchingLine = {
                        x1: this.verticalLine[0].x,
                        y1: this.verticalLine[0].y,
                        x2: this.verticalLine[1].x,
                        y2: this.verticalLine[1].y,
                    }
                    console.log("VERTICAL");
                } else {
                     this.matchingLine = {
                        x1: this.horizontalLine[0].x,
                        y1: this.horizontalLine[0].y,
                        x2: this.horizontalLine[1].x,
                        y2: this.horizontalLine[1].y,
                    }
                    console.log("HORIZONTAL");
                }

                console.log("M: ", Math.abs((this.buildingConnection.x - this.matchingPoint.x)/(this.buildingConnection.y - this.matchingPoint.y)), Math.abs((this.buildingConnection.x - this.boxConnection.x)/(this.buildingConnection.y - this.boxConnection.y)))
                console.log("P:", this.matchingPoint, "L:", this.matchingLine);*/
        },
        lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
            if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
                return false
            }
            var denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))
            if (denominator === 0) {
                return false
            }
            let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
            let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator
            if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
                return false
            }
            let x = x1 + ua * (x2 - x1)
            let y = y1 + ua * (y2 - y1)
            return {x, y}
        },
        startDrag() {
            this.dragging = true;
        },
        stopDrag() {
            this.dragging = false;
        },
        doDrag(event) {
            if (this.dragging && window.innerWidth >= 1024) {
                this.checkPositions();
            }
        }
    }
}
</script>

<template>
    <div class="ctx_menu" @click="selectedModal()"  @mousedown="startDrag" @mousemove="doDrag" v-bind:style="{ zIndex: indexVal }">
        <div class="wrapper">
            <div class="ctx_bar"><v-icon size="18px">mdi-city</v-icon> <p>{{ objInfo.objectType }} - {{ objInfo.objectId }}</p><div class="close_btn" @click="$emit('close')"><v-icon>mdi-close</v-icon></div></div>
            <div class="general" v-for="item in objInfo.generalContent"><p>
                <div v-for="(value, key) in item">
                  <p>{{ key }} : {{ value }}</p>
                </div>
              </div>
            </div>
            <div class="head_scope" v-for="(content, name) in objInfo.detailContent">
                <div class="head_bar"><h3>{{ name }}</h3></div>
                    <div v-for="ctx in content">
                      <div v-for="(value, key) in ctx">
                        <p><strong>{{ key }}</strong> {{value}} </p>
                      </div>
                    </div>
            </div>
          <!-- amenities -->
          <div v-if="objInfo.objectType === 'amenity'">
            <div class="body_scope"></div>
            <div class="od-menu">
              <v-checkbox
                v-model="this.asOrigin"
                label="Origin of"
                @change="updateTrips(objectData, 'origin')"
                dark
                hide-details
              ></v-checkbox>
              <v-checkbox
                v-model="this.asDestination"
                label="Destination of"
                @change="updateTrips(objectData, 'destination')"
                dark
                hide-details
              ></v-checkbox>
            </div>
          </div>
        </div>
        <!--<svg class="connection"><line :x1="Math.round(buildingConnection.x)" :y1="Math.round(buildingConnection.y)" :x2="Math.round(boxConnection.x)" :y2="Math.round(boxConnection.y)" stroke-width="1px" stroke="white"/></svg>-->
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
