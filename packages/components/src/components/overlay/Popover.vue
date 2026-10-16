<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    title?: string;
  }>(),
  { title: '' },
);

const open = ref(false);

function close() {
  open.value = false;
}

defineExpose({ close });
</script>

<template>
  <span class="cumquat-popover">
    <span class="cumquat-popover__trigger" @click="open = !open">
      <slot name="trigger" />
    </span>
    <Transition name="cumquat-fade">
      <div v-if="open" class="cumquat-popover__content">
        <span class="cumquat-popover__arrow" />
        <h4 v-if="title" class="cumquat-popover__title">{{ title }}</h4>
        <div class="cumquat-popover__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="cumquat-popover__footer">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </Transition>
  </span>
</template>
