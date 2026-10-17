<script setup lang="ts">
import { computed, inject } from 'vue';
import { useFormField } from '@cumquat/composables';
import type { CheckableGroupReturn } from '@cumquat/composables';

type V = string | number;

const props = withDefaults(
  defineProps<{
    /** 该选项的取值 */
    value: V;
    modelValue?: V | null;
    label?: string;
    disabled?: boolean;
    name?: string;
  }>(),
  { modelValue: undefined, label: '', disabled: false, name: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: V];
}>();

const field = useFormField<V | null>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    if (value !== null) emit('update:modelValue', value);
  },
  disabled: () => props.disabled,
});

/** 处于 RadioGroup 内时由组上下文接管值与互斥 */
const group = inject<CheckableGroupReturn<V> | undefined>('cumquat-radio-group', undefined);

const isChecked = computed(() =>
  group ? group.isChecked(props.value) : field.value.value === props.value,
);

function pick() {
  if (props.disabled) return;
  if (group) group.select(props.value);
  else field.handleChange(props.value);
}
</script>

<template>
  <label class="cumquat-radio" :class="disabled ? 'cumquat-radio--disabled' : ''" @click="pick">
    <input
      type="radio"
      class="cumquat-radio__input"
      :checked="isChecked"
      :disabled="disabled"
      @change="pick"
    />
    <span class="cumquat-radio__dot" :class="isChecked ? 'cumquat-radio__dot--checked' : ''">
      <span
        class="cumquat-radio__inner"
        :class="isChecked ? 'cumquat-radio__inner--checked' : ''"
      />
    </span>
    <span v-if="label || $slots.default" class="cumquat-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
