<template>
  <div class="w-screen h-screen flex gap-4">
    <div class="p-4 border flex flex-col gap-2">
      <router-link
        v-for="item in routes.slice(1, routes.length)"
        :key="item.name"
        :to="item.path"
      >
        {{ item.name }}
      </router-link>
    </div>
    <div class="p-4">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { routes } from "./router";
</script>
