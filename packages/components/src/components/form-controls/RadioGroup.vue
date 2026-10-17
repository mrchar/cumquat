<script setup lang="ts">
import { provide } from 'vue';
import { useCheckableGroup } from '@cumquat/composables';

type V = string | number;

const props = withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical';
    modelValue?: V | null;
    disabled?: boolean;
  }>(),
  { direction: 'horizontal', modelValue: undefined, disabled: false },
);

const emit = defineEmits<{
  'update:modelValue': [value: V | null];
}>();

const group = useCheckableGroup<V>({
  multiple: false,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => emit('update:modelValue', value as V | null),
});

provide('cumquat-radio-group', group);
</script>

<template>
  <div
    class="cumquat-radio-group"
    :class="[`cumquat-radio-group--${direction}`, disabled ? 'cumquat-radio-group--disabled' : '']"
    role="radiogroup"
  >
    <slot />
  </div>
</template>
