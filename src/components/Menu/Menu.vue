<script>
import { mapState } from 'vuex'
import AbmScenario from "@/components/Scenario/AbmScenario.vue";

export default {
    name: 'Menu',
    components: {AbmScenario},
    methods:{

    }
}
</script>

<template>
    <div id="menu">
        <div class="header_scope">
            <h3>Grassbrook CityScope</h3>
            <p>Tool for Functional Planning</p>
        </div>
        <div class="body_scope">
            <AbmScenario />
        </div>
        <div class="footer_scope">

        </div>
    </div>
</template>

<style scoped lang='scss'>
    @import "../../style.main.scss";

    #menu {
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        transform:translateX(100%);
        font-family: 'Tajawal', sans-serif;

        .header_scope {
            h3 {
                width:100%;
                padding: 10px 20px 0px 20px;
                box-sizing:border-box;
                text-align:left;
                font-size:110%;
                color:$bright1;
            }
            p {
                width:100%;
                padding:0px 20px 10px 20px;
                box-sizing:border-box;
                text-align:left;
                font-size:90%;
                color:$bright2;
            }
        }
        .body_scope {}
        .footer_scope {}

        @media(min-device-width:1024px){
            right:0;
            left:auto;
            width:30vw;
            max-width:340px;
            transform:translateX(0);
            background:rgba(0,0,0,0.8);
        }
    }
</style>
