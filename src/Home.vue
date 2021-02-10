<script>
import { mapActions } from "vuex";
import App from './App.vue'

export default {
  name: "Home",
  components: {
    App
  },
  computed: {
    cityPyO(){
      return this.$store.state.cityPyO;
    },
    workshop(){
      return this.$store.state.workshop;
    },
  },
  data() {
    return {
      authenticated: false,
      form: {
        username: "",
        password: "",
      },
      showError: false
    };
  },
  mounted(){
    this.$store.dispatch('checkoutPublicAccess');
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
      this.authenticated =  await this.$store.dispatch('connect', userdata)
      this.showError = !this.authenticated
    },
  },
};
</script>

<template>
  <v-app>
      <div class="login" v-if="!workshop && !authenticated" :style="{ backgroundImage: 'url(' + require('@/assets/grasbrook.png')}">
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
<!--            <div class="public_teaser">
              <p>Click here for a public version</p>
              <v-btn href="/public">Public Version</v-btn>
            </div>-->
          </form>
        </div>
      </div>
    <template v-if="workshop || authenticated">
      <App/>
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
}
#error {
  margin-top: 20px;
  color: red;
}
</style>
