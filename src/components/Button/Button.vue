<template>
  <button @click.stop="onClick()" :disabled="loading">
    <div v-if="loading">
      <Loading class="text-white" />
    </div>
    <div v-else>
      <slot />
    </div>
  </button>
</template>

<script lang="ts" setup>
import Loading from "../Loading/Loading.vue";
import { useButton } from "./button.ts";

const props = defineProps(["onClick"]);

const { loading, onClick } = useButton(props.onClick);
</script>

<style scoped>
button {
  @apply w-20 h-12 px-4 py-2;
  @apply border-2 rounded-lg;
  @apply shadow-lg hover:shadow-none;
  @apply bg-blue-500 hover:bg-blue-400 text-white;
  @apply inline-flex justify-center items-center;
}
</style>
