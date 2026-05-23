<template>
  <TaskPane />
</template>

<script setup>
import { onMounted } from 'vue';
import TaskPane from './components/TaskPane.vue';
import ribbon from './ribbon.js';

onMounted(() => {
  window.ribbon = ribbon;
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, "Microsoft YaHei", sans-serif;
  font-size: 13px;
  background: #ffffff;
}
</style>
