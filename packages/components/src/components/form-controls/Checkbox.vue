<script setup lang="ts">
import { computed, inject } from 'vue';
import { useFormField } from '@cumquat/composables';
import type { CheckableGroupReturn } from '@cumquat/composables';

type V = string | number | boolean;

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    /** 成组使用时该选项的取值（配合外部 CheckboxGroup 上下文） */
    value?: V;
    label?: string;
    disabled?: boolean;
    /** 半选态（纯视觉） */
    indeterminate?: boolean;
    name?: string;
  }>(),
  {
    modelValue: undefined,
    value: undefined,
    label: '',
    disabled: false,
    indeterminate: false,
    name: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const field = useFormField<boolean>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: false,
  onChange: (value) => emit('update:modelValue', value),
  disabled: () => props.disabled,
});

/** 可选的成组勾选上下文（由外层容器通过 provide('cumquat-checkbox-group') 提供） */
const group = inject<CheckableGroupReturn<V> | undefined>('cumquat-checkbox-group', undefined);

const isChecked = computed(() =>
  group && props.value !== undefined ? group.isChecked(props.value) : field.value.value,
);
const groupDisabled = computed(() => props.disabled);

function onToggle(event: Event) {
  const next = (event.target as HTMLInputElement).checked;
  if (group && props.value !== undefined) group.select(props.value, next);
  else field.handleChange(next);
}
</script>

<template>
  <label class="cumquat-checkbox" :class="groupDisabled ? 'cumquat-checkbox--disabled' : ''">
    <input
      type="checkbox"
      class="cumquat-checkbox__input"
      :checked="isChecked"
      :indeterminate.prop="indeterminate"
      :disabled="groupDisabled"
      @change="onToggle"
    />
    <span
      class="cumquat-checkbox__box"
      :class="isChecked || indeterminate ? 'cumquat-checkbox__box--active' : ''"
    >
      <svg
        v-if="indeterminate && !isChecked"
        class="cumquat-checkbox__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      >
        <path d="M5 12h14" />
      </svg>
      <svg
        v-else-if="isChecked"
        class="cumquat-checkbox__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="cumquat-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>
