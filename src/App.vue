<template>
  <div class="w-screen h-screen flex gap-4">
    <div class="p-4 border flex flex-col gap-2">
      <router-link v-for="item in menus" :key="item.title" :to="item.path">
        {{ item.title }}
      </router-link>
    </div>
    <div class="p-4">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const menus = ref([
  { title: "Loading", path: "/loading" },
  {
    title: "Button",
    path: "/button",
  },
]);
</script>
