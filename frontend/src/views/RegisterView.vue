<template>
  <div class="auth-container">
    <h2>Inscription</h2>
    <form @submit.prevent="register">
      <div>
        <label>Nom d'utilisateur :</label>
        <input v-model="username" type="text" required />
      </div>
      <div>
        <label>Email :</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Mot de passe :</label>
        <input v-model="password" type="password" required />
      </div>
      <button type="submit">S'inscrire</button>
    </form>
    <p v-if="message" class="info">{{ message }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RegisterView",
  data() {
    return {
      username: "",
      email: "",
      password: "",
      message: "",
    };
  },
  methods: {
    async register() {
      try {
        const response = await axios.post("/api/Authentification/register", {

            username: this.username,
            email: this.email,
            password: this.password,
          }
        );
        this.message = "Inscription réussie ✅";
      } catch (error) {
  console.error(error.response?.data || error.message);
  this.message = error.response?.data?.[0]?.description || "Erreur lors de l'inscription ❌";
  }
    },
  },
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 2rem auto;
}
.info {
  color: green;
}
</style>
