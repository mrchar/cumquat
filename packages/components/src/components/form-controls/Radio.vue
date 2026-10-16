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
  <label class="cumquat-radio" :class="disabled ? 'cumquat-radio--disabled' : ''" @click="pick">
    <input
      v-model="model"
      type="radio"
      :value="value"
      class="cumquat-radio__input"
      :disabled="disabled"
    />
    <span class="cumquat-radio__dot" :class="model === value ? 'cumquat-radio__dot--checked' : ''">
      <span
        class="cumquat-radio__inner"
        :class="model === value ? 'cumquat-radio__inner--checked' : ''"
      />
    </span>
    <span v-if="label || $slots.default" class="cumquat-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
