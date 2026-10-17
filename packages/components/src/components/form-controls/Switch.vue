<script setup lang="ts">
import { useFormField } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    disabled?: boolean;
    name?: string;
  }>(),
  { modelValue: undefined, label: '', disabled: false, name: undefined },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  change: [value: boolean];
}>();

const field = useFormField<boolean>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: false,
  onChange: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
  disabled: () => props.disabled,
});

function toggle() {
  if (props.disabled) return;
  field.handleChange(!field.value.value);
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="field.value.value"
    :disabled="disabled"
    class="cumquat-switch"
    :class="field.value.value ? 'cumquat-switch--checked' : ''"
    @click="toggle"
  >
    <span
      class="cumquat-switch__thumb"
      :class="field.value.value ? 'cumquat-switch__thumb--checked' : ''"
    />
    <span v-if="label" class="cumquat-switch__label">{{ label }}</span>
  </button>
</template>
