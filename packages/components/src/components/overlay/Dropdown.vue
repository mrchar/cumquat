<script setup lang="ts">
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <div class="cumquat-dropdown relative inline-block">
    <div class="cumquat-dropdown__trigger inline-flex" @click="open = !open">
      <slot name="trigger" />
    </div>
    <Transition name="cumquat-fade">
      <div
        v-if="open"
        role="menu"
        class="cumquat-dropdown__menu absolute left-0 z-20 mt-1.5 min-w-36 rounded-cumquat border border-cumquat-border bg-cumquat-surface py-1.5 shadow-cumquat-overlay"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>
