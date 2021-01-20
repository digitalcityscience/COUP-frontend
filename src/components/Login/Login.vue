


<script>
import { mapActions } from "vuex";
export default {
  name: "Login",
  components: {},
  computed: {
    cityPyO(){
      return this.$store.state.cityPyO;
    }
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
  methods: {
    ...mapActions(["LogIn"]),
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    async submit() {
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
  <v-overlay v-if="!workshop && !authenticated">
    <div class="login" v-if="!authenticated">
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
          <button type="submit">Submit</button>
        </form>
        <p v-if="showError" id="error">Username or Password is incorrect</p>
      </div>
    </div>
  </v-overlay>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
label {
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
}
#error {
  margin-top: 20px;
  color: red;
}
</style>
