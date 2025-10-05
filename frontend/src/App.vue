<template>
  <router-view />
</template>

<script setup>
// Rien à importer ici
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>
