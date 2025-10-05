<template>
  <div class="login-container">
    <h2>Connexion</h2>

    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>

      <div class="form-group">
        <label>Mot de passe</label>
        <input v-model="password" type="password" required />
      </div>

      <button type="submit">Se connecter</button>
    </form>

    <p>
      Pas de compte ?
      <router-link to="/register">Créer un compte</router-link>
    </p>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const handleLogin = async () => {
  try {
    const response = await axios.post('/api/authentification/login', {

      email: email.value,
      password: password.value
    })

    // Sauvegarder le token dans localStorage
    localStorage.setItem('token', response.data.token)

    // Redirection vers l'app principale
    router.push('/app')
  } catch (error) {
    errorMessage.value = 'Email ou mot de passe invalide'
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 150px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background: #2563eb;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
