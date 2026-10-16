<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    disabled?: boolean;
  }>(),
  { label: '', disabled: false },
);

const checked = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="checked"
    :disabled="disabled"
    class="cumquat-switch"
    :class="checked ? 'cumquat-switch--checked' : ''"
    @click="checked = !checked"
  >
    <span class="cumquat-switch__thumb" :class="checked ? 'cumquat-switch__thumb--checked' : ''" />
    <span v-if="label" class="cumquat-switch__label">{{ label }}</span>
  </button>
</template>
