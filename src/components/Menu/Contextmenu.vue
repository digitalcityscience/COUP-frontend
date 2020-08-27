<script>
import { mapState } from 'vuex'

export default {
    name: 'Contextmenu',
    components: {},
    data() {
        return {
            objType:'',
            objId:'',
            objGFA:'',
            objectData:[],
        }
    },
    computed: {
        clickPosition(){
            return this.$store.state.scenario.lastClick;
        },
        features(){
            return this.$store.state.selectedFeatures;
        }
    },
    beforeMount(){
        this.objType = this.features[0].properties.area_planning_type;
        this.objId = this.features[0].properties.building_id;
        this.objGFA = Math.round(this.features[0].properties.floor_area);
        this.objectData = this.features.filter((feature,i,a) => {
            return a.indexOf(feature.layer.id) === i;
        });

        this.objectData = this.features.reduce((acc, current) => {
            const duplicateLayer = acc.find(feature => feature.layer.id === current.layer.id);
            if (!duplicateLayer) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);
    },
    mounted(){
        const ctxMenu = document.querySelector(".ctx_menu");
       /* ctxMenu.style.top = this.clickPosition[0] + 10 + "px";
        ctxMenu.style.left = this.clickPosition[1] + 10 + "px";*/
    },
    beforeDestroy() {
        const newFeature = this.features;
        newFeature.forEach(feature => {
            feature.properties.selected = "inactive";
            this.$store.dispatch('editFeatureProps', feature)
        });
        
    },
    methods:{
    }
}
</script>

<template>
    <div class="ctx_menu">
        <div class="wrapper">
            <div class="ctx_bar"><v-icon size="18px">mdi-city</v-icon> <p>{{ objType }} - {{ objId }}</p></div>
            <div class="general"><p>GFA: {{ objGFA }}m²</p></div>
            <div class="head_scope" v-for="building in objectData" :key="building.layer.id">
                <div class="head_bar"><h3>{{ building.layer.id }}</h3></div>
                <div v-if="building.properties.number_of_stories">
                    <p><strong>total floorarea</strong> {{ objGFA * building.properties.number_of_stories }}m²</p>
                    <p><strong>stories</strong> {{ building.properties.number_of_stories }}</p>
                </div>
                <p><strong>use case</strong> {{ building.properties.land_use_detailed_type }}</p>
            </div>
            <div class="body_scope"></div>
        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    .ctx_menu {
        position:relative;
        //position:fixed;
        width:280px;
        //min-height:200px;
        background:rgba(0,0,0,0.9);
        max-width:100%;
        padding:5px;
        box-sizing: border-box;
        @include drop_shadow;

        .ctx_bar {
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
    }
</style>
