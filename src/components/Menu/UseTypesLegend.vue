<script>
import { mapState } from 'vuex'
import {generateStoreGetterSetter} from "@/store/utils/generators";

export default {
    name: 'UseTypesLegend',
    components: {},
    data() {
        return {
            buildingUses: [{
              'use': 'Residential',
              'color': '#FFB121'
            },
              {
                'use': 'Commercial | Office',
                'color': '#F76A6A'
              },
              {
                'use': 'Public | Daycare',
                'color': '#4EBFFC'
              }
            ],
            useTypes: {
              'Buildings': [{
                'use': 'Residential',
                'color': 'red'
                },
                {
                'use': 'Commercial',
                'color': 'blue'
                },
                {
                'use': 'Special Use',
                'color': 'yellow'
                },
              ],
              'OpenSpace': [
                {
                  'use': "Promenade",
                  'color': 'pink'
                },
                {
                  'use': "Street",
                  'color': 'black'
                },
              ]
            },
        }
    },
    computed: {
      ...mapState([
        'allFeaturesHighlighted'
        ]),
      ...generateStoreGetterSetter([
          ['showLegend', 'showLegend' ]
        ]),
    },
    beforeDestroy() {
      this.showLegend = false;
    },
    methods:{}
}
</script>

<template>
    <div class="legend">
        <div class="wrapper">
            <div class="legend_bar"><v-icon size="18px">mdi-city</v-icon> <p>Use Types</p></div>
            <!--<div class="head_scope" v-for="generalUseType in useTypes" :key="generalUseType">   -->
            <div class="head_scope">
              <div class="head_bar"><h3>Buildings</h3></div>
              <div v-for="useType in buildingUses">
                <div class="dot" v-bind:style="{background: useType.color}"></div>
                <p><strong>{{ useType.use }}</strong></p>
              </div>
            </div>
            <div class="body_scope"></div>
        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    .legend {
        //position:relative;
        position:relative;
        //width:150px;
        //min-height:200px;
        background:rgba(0,0,0,0.9);
        max-width:100%;
        padding:5px;
        box-sizing: border-box;
        @include drop_shadow;

        .legend_bar {
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

            .dot {
              height: 10px;
              width: 10px;
              margin: 5px;
              border-radius: 50%;
              float:left
            }

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
