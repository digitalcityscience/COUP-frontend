<script>
import { mapActions } from "vuex";
import App from './App.vue'
import CityPyoDefaultUser from '@/config/cityPyoDefaultUser.json'
import xsImage from '@/assets/login_background_320.png'
import smImage from '@/assets/login_background_576.png'
import mdImage from '@/assets/login_background_900.png'
import lgImage from '@/assets/login_background_1200.png'
import xlImage from '@/assets/login_background_1900.png'

export default {
  name: "Login",
  components: {
    App
  },
  computed: {
    cityPyO(){
      return this.$store.state.cityPyO;
    }
  },
  data() {
    return {
      authenticated: false,
      restrictedAccess: true,
      form: {
        username: "",
        password: "",
      },
      showError: false,
      backgroundImages: [
      { size: 'xs', src: xsImage },
      { size: 'sm', src: smImage },
      { size: 'md', src: mdImage },
      { size: 'lg', src: lgImage },
      { size: 'xl', src: xlImage }
    ]
    };
  },
  mounted(){
    /** todo comment in again
    if (process.env.NODE_ENV === 'development') {
      this.form.username = CityPyoDefaultUser.username
      this.form.password = CityPyoDefaultUser.password
      this.submit()
    }
     */
  },
  methods: {
    ...mapActions(["LogIn"]),
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    backgroundImage() {
      const img = this.backgroundImages.find(
        r => r.size === this.$vuetify.breakpoint.name
      )

      return img.src
    },
    async submit() {
      this.authenticated = false;

      const userdata = {"userdata": {
          "username": this.form.username,
          "password": this.form.password
        }
      }
      const loginResult =  await this.$store.dispatch('connect', userdata)
      this.authenticated =  loginResult.authenticated
      if (this.authenticated) {
        this.restrictedAccess = loginResult.restricted
      }
      this.showError = !this.authenticated
    },
  },
};
</script>

<template>
  <v-app>
        <div class="component_content">
        <div v-if="!authenticated" class="login_background">
          <div class="background_image" :style="{ backgroundImage: `url(${backgroundImage()})`}">
            <div>
              <form @submit.prevent="submit" class="submit_form" >
                <div>
                  <label for="username">Username</label>
                  <input id="input_field" type="text" name="username" v-model="form.username" />
                </div>
                <div>
                  <label for="password">Password</label>
                  <input id="input_field" type="password" name="password" v-model="form.password" />
                </div>
                <div style="opacity: 1">
                <v-btn class="submit_button" type="submit">Access</v-btn>
                <p v-if="showError" id="error">Username or Password is incorrect</p>
                </div>
              </form>
            </div>
      </div>
    </div>
        </div>
    <template v-if="authenticated">
      <App :restrictedAccess="restrictedAccess" />
    </template>
  </v-app>
</template>

<style scoped lang='scss'>
   @import "style.main.scss";

  .login_background {
    position:fixed;
    top:0;
    left:0;
    width:100vw;
    height:100vh;
    background-color: rgba(0,0,0,1);
    transition:0.3s;
  }

  .background_image{
    top:0;
    left:0;
    width:100vw;
    height:100vh;
    position: absolute;
  }

  .submit_form {
    width: 250px;
    padding:10px;
    box-sizing: border-box;
    color: whitesmoke;
    font-family: 'Tajawal', sans-serif;
    background: rgb(41,66,82, 0.35);
    border:1px solid #888;
    margin:300px auto;

    @media(max-device-height:540px) {
      margin: 100px auto;
    }
    @media(max-device-width:600px) {
      margin: 300px auto;
    }
  }

  .submit_button{
    background: #0176AC !important;
    color: whitesmoke;
    box-shadow: 0px 15px 25px -10px rgb(0 0 0 / 75%);
    border-radius: 0;
    text-shadow: none;
    width: calc(100% - 30px);
    margin-top: 20px;
  }



  #input_field {
    width: calc(100% - 30px);
    max-height: 30px;
    margin:0;
    background-color: #444444;
    opacity: 0.35;
    color: whitesmoke;
  }

  form {
    margin-top: 20vh;
    margin-left: 60vw;
    color: white;
    position: relative;
  }

  label {
    font-weight: bold;
    display: block;
    color: white;
    text-align: left !important;
    margin-top: 10px;
  }

  input {
    margin: 10px;
    padding:10px;
    background-color: rgba(0, 0, 0, 0.8);
    color: whitesmoke !important;
  }

  #error {
    margin-top: 20px;
    color: red;
  }
</style>
