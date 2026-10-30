<template>
  <main ref="mount" class="app" aria-live="polite"></main>
</template>

<script setup>
import { onMounted, ref } from "vue";

const { mountRouteRoot } = window.__OFFICE_TOOLBOX_CORE__;

const mount = ref(null);

onMounted(() => {
  mountRouteRoot(mount.value, "interest");
});
</script>
