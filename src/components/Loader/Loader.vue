<script>
import { mapState } from 'vuex'

export default {
    name: 'Contextmenu',
    components: {},
    data() {
        return {
           loading: this.loader,
        }
    },
    computed: {
      ...mapState([
        'allFeaturesHighlighted',
        'map',
        ]),
        loader(){
            return this.$store.state.scenario.loader;
        }
    },
    watch: {
        loader(val){
            console.log("iam logging", val);
            this.loading = val;
        }
    },
    mounted(){ 
        console.log("at beginners lvl", this.loading);
    },
    methods:{
        
    }
}
</script>

<template>
 
        <div id="big_loader" :class="loading ? '' : 'hidden'">
            <div class="css-loader"><div></div><div></div><div></div><div></div></div>
        </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    #big_loader {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        z-index:3;
        backdrop-filter:blur(5px) saturate(180%);
        background:radial-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.8));

        &.hidden {
            display:none;
        }

        .css-loader {
            position:absolute;
            display: block;
            top:50%;
            left:50%;
            transform:translate(-50%,-50%);
            opacity:0.75;
            width: 80px;
            height: 80px;
            div {
                position: absolute;
                top: 33px;
                width: 13px;
                height: 13px;
                border-radius: 50%;
                background: #fff;
                animation-timing-function: cubic-bezier(0, 1, 1, 0);
            }

            div:nth-child(1) {
                left: 8px;
                animation: lds-ellipsis1 0.6s infinite;
            }
            div:nth-child(2) {
                left: 8px;
                animation: lds-ellipsis2 0.6s infinite;
            }
            div:nth-child(3) {
                left: 32px;
                animation: lds-ellipsis2 0.6s infinite;
            }
            div:nth-child(4) {
                left: 56px;
                animation: lds-ellipsis3 0.6s infinite;
            }
        }
    }

    @keyframes lds-ellipsis1 {
        0% {
            transform: scale(0);
        }
        100% {
            transform: scale(1);
        }
        }
        @keyframes lds-ellipsis3 {
        0% {
            transform: scale(1);
        }
        100% {
            transform: scale(0);
        }
        }
        @keyframes lds-ellipsis2 {
        0% {
            transform: translate(0, 0);
        }
        100% {
            transform: translate(24px, 0);
        }
    }
</style>
