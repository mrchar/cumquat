<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** 该选项的取值 */
    value: string | number;
    label?: string;
    disabled?: boolean;
  }>(),
  { label: '', disabled: false },
);

const model = defineModel<string | number | null>({ default: null });

function pick() {
  if (!props.disabled) model.value = props.value;
}
</script>

<template>
  <label
    class="cumquat-radio inline-flex cursor-pointer items-center gap-2 text-sm text-cumquat-text select-none"
    :class="disabled ? 'cursor-not-allowed opacity-50' : ''"
    @click="pick"
  >
    <input v-model="model" type="radio" :value="value" class="peer sr-only" :disabled="disabled" />
    <span
      class="cumquat-radio__dot flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cumquat-accent"
      :class="
        model === value
          ? 'border-cumquat-accent'
          : 'border-cumquat-border-strong bg-cumquat-surface'
      "
    >
      <span
        class="cumquat-radio__inner size-2 rounded-full transition-colors"
        :class="model === value ? 'bg-cumquat-accent' : 'bg-transparent'"
      />
    </span>
    <span v-if="label || $slots.default" class="cumquat-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
