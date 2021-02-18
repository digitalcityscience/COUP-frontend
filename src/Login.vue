<script>
import { mapActions } from "vuex";
import App from './App.vue'
import CityPyoDefaultUser from '@/config/cityPyoDefaultUser.json'

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
      showError: false
    };
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
      <div class="login" v-if="!authenticated" :style="{ backgroundImage: 'url(' + require('@/assets/grasbrook.png')}">
        <div>
          <form @submit.prevent="submit">
            <div>
              <label for="username">Username:</label>
              <input type="text" name="username" v-model="form.username" />
            </div>
            <div>
              <label for="password">Password:</label>
              <input type="password" name="password" v-model="form.password" />
            </div>
            <button type="submit">Access</button>
            <p v-if="showError" id="error">Username or Password is incorrect</p>
          </form>
        </div>
      </div>
    <template v-if="authenticated">
      <App :restrictedAccess="restrictedAccess" />
    </template>
  </v-app>
</template>

<style scoped>

.public_teaser {
  padding: 20px;
}

.login {
  width: 100%;
  height: 100%;
  background-position: center 0;
  opacity: 0.7;
}

* {
  box-sizing: border-box;
}

form {
  margin-top: 40vh;
  margin-left: 40vw;
  color: white;
}

label {
  font-weight: bolder;
  padding: 12px 12px 12px 0;
  display: inline-block;
}
button[type=submit] {
  background-color: #4CAF50;
  color: white;
  padding: 12px 20px;
  cursor: pointer;
  border-radius:30px;
}
button[type=submit]:hover {
  background-color: #45a049;
}
input {
  margin: 5px;
  box-shadow:0 0 15px 4px rgba(0,0,0,0.06);
  padding:10px;
  border-radius:30px;
  background-color: #E8F0FE !important;
  color: black;
}
#error {
  margin-top: 20px;
  color: red;
}
</style>
