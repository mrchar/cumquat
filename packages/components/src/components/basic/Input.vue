<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFormField } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    type?: string;
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    /** 外部强制校验失败态（红框）；表单上下文中也会取字段校验错误 */
    invalid?: boolean;
    /** 多行文本域 */
    textarea?: boolean;
    rows?: number;
    /** 可清空 */
    clearable?: boolean;
    /** 显示字数统计 */
    showWordLimit?: boolean;
    maxlength?: number;
    /** 失焦时去除首尾空白并回发 */
    trim?: boolean;
    name?: string;
  }>(),
  {
    type: 'text',
    size: 'md',
    placeholder: '',
    disabled: false,
    readonly: false,
    invalid: false,
    textarea: false,
    rows: 3,
    clearable: false,
    showWordLimit: false,
    maxlength: undefined,
    trim: false,
    name: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  clear: [];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const field = useFormField<string>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: '',
  onChange: (value) => emit('update:modelValue', value),
  disabled: () => props.disabled,
});

/** 输入法组合（IME）期间暂存原始值，不触发更新 */
const composing = ref(false);
const focused = ref(false);

const invalidState = computed(() => props.invalid || field.error.value !== undefined);
const showClear = computed(
  () =>
    props.clearable &&
    !props.disabled &&
    !props.readonly &&
    field.value.value.length > 0 &&
    focused.value,
);

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  if (composing.value) return;
  field.handleChange(raw);
}

function onCompositionStart() {
  composing.value = true;
}

function onCompositionEnd(event: CompositionEvent) {
  composing.value = false;
  field.handleChange((event.target as HTMLInputElement | HTMLTextAreaElement).value);
}

function onBlur(event: FocusEvent) {
  focused.value = false;
  field.handleBlur();
  if (props.trim) {
    const next = field.value.value.trim();
    if (next !== field.value.value) field.handleChange(next);
  }
  // 原生 blur 继续透出给宿主
  emit('blur', event);
}

function onFocus(event: FocusEvent) {
  focused.value = true;
  emit('focus', event);
}

function clearValue() {
  field.handleChange('');
  emit('clear');
}

defineExpose({
  validate: field.validate,
  clearValidate: field.clearValidate,
  focus: () => {
    (document.getElementById(field.fieldId.value) as HTMLInputElement | null)?.focus();
  },
});
</script>

<template>
  <div
    class="cumquat-input"
    :class="[
      `cumquat-input--${size}`,
      invalidState ? 'cumquat-input--invalid' : '',
      $slots.prefix ? 'cumquat-input--prefix' : '',
      $slots.suffix || clearable || showWordLimit ? 'cumquat-input--suffix' : '',
      textarea ? 'cumquat-input--textarea' : '',
    ]"
  >
    <span v-if="$slots.prefix" class="cumquat-input__prefix">
      <slot name="prefix" />
    </span>

    <textarea
      v-if="textarea"
      v-bind="field.aria.value"
      :value="field.value.value"
      class="cumquat-input__inner"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      @input="onInput"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @focus="onFocus"
      @blur="onBlur"
    />
    <input
      v-else
      v-bind="field.aria.value"
      :value="field.value.value"
      :type="type"
      class="cumquat-input__inner"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      @input="onInput"
      @compositionstart="onCompositionStart"
      @compositionend="onCompositionEnd"
      @focus="onFocus"
      @blur="onBlur"
    />

    <span v-if="clearable || showWordLimit || $slots.suffix" class="cumquat-input__suffix">
      <button
        v-if="showClear"
        type="button"
        aria-label="清空"
        class="cumquat-input__clear"
        @mousedown.prevent
        @click="clearValue"
      >
        <svg
          class="cumquat-input__clear-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      </button>
      <slot name="suffix" />
      <span v-if="showWordLimit" class="cumquat-input__count">
        {{ field.value.value.length }}<template v-if="maxlength">/{{ maxlength }}</template>
      </span>
    </span>
  </div>
</template>
