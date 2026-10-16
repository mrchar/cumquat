<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <div class="cumquat-dropdown">
    <div class="cumquat-dropdown__trigger" @click="open = !open">
      <slot name="trigger" />
    </div>
    <Transition name="cumquat-fade">
      <div v-if="open" role="menu" class="cumquat-dropdown__menu">
        <slot />
      </div>
    </Transition>
  </div>
</template>
