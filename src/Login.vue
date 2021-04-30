<script>
import { mapActions } from "vuex";
import App from './App.vue'
import CityPyoDefaultUser from '@/config/cityPyoDefaultUser.json'
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
      passwordFieldType: "password",
      passwordIcon: "mdi-eye",
      showError: false,
      backgroundImage: xlImage
    }
  },
  mounted(){
    if (process.env.NODE_ENV === 'development') {
      this.form.username = CityPyoDefaultUser.username
      this.form.password = CityPyoDefaultUser.password
      this.submit()
    }
  },
  methods: {
    ...mapActions(["LogIn"]),
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    switchVisibility() {
      this.passwordFieldType = this.passwordFieldType === "password" ? "text" : "password";
      this.passwordIcon = this.passwordFieldType === "password" ? "mdi-eye" : "mdi-eye-off";
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
        <div v-if="!authenticated" class="login_background" :style="{backgroundImage: `url(${backgroundImage})`}">
            <div>
              <form @submit.prevent="submit" class="submit_form" >
                <div>
                  <label for="username">Username</label>
                  <input id="input_field_user" type="text" name="username" v-model="form.username" />
                </div>
                <label for="password">Password <v-icon color="white" @click="switchVisibility">
                  {{ passwordIcon }}</v-icon></label>
                <input id="input_field_pw" :type="passwordFieldType" name="password" v-model="form.password">
                <!-- submit button -->
                <div>
                <v-btn class="submit_button" type="submit">Access</v-btn>
                <p v-if="showError" id="error">Username or Password is incorrect</p>
                </div>
              </form>
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
    transition:0.3s;
    background-color: rgba(0,0,0,1);
    background-position: center center;
    background-size: cover;
    background-repeat: no-repeat;
  }

  .submit_form {
    width: 250px;
    padding:10px;
    box-sizing: border-box;
    color: whitesmoke;
    font-family: 'Tajawal', sans-serif;
    background: rgb(41,66,82, 0.5);
    border:1px solid #888;
    margin:300px auto;

    @media(min-device-width:600px) {
      margin: 300px auto;
    }
    @media(max-device-height:800px) {
      margin: 100px auto;
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

  #input_field_user {
    width: calc(100% - 30px);
    max-height: 30px;
    margin:0;
    background-color: #444444;
    opacity: 0.5;
    color: whitesmoke;
    border-color: rgb(111, 111, 111);
    border-width: 2px !important;
    border-top-width: 4px;
    border-style: solid;
  }

  #input_field_pw {
      width: calc(100% - 30px);
      max-height: 30px;
      margin:0;
      background-color: #444444;
      opacity: 0.5;
      color: whitesmoke;
      border-color: rgb(111, 111, 111);
      border-width: 2px !important;
      border-top-width: 4px;
      border-style: solid;

    .textarea {
      color: white !important;
    }
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
    margin-left: 15px;
  }

  input {
    margin: 10px;
    padding:10px;
    background-color: rgba(0, 0, 0, 0.8);
    color: whitesmoke !important;
  }

   .v-icon {
     font-size:18px;
     display: inline-block;
   }

  #error {
    margin-top: 20px;
    color: red;
  }
</style>
