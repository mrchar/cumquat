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
    class="cumquat-switch relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cumquat-accent disabled:cursor-not-allowed disabled:opacity-50"
    :class="checked ? 'bg-cumquat-accent' : 'bg-cumquat-border-strong'"
    @click="checked = !checked"
  >
    <span
      class="cumquat-switch__thumb pointer-events-none inline-block size-4.5 transform rounded-full bg-white shadow transition-transform"
      :class="checked ? 'translate-x-5' : 'translate-x-0.5'"
    />
    <span v-if="label" class="cumquat-switch__label ml-2 text-sm text-cumquat-text select-none">{{
      label
    }}</span>
  </button>
</template>
