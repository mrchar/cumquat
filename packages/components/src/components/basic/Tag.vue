<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useControllableModel, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    closable?: boolean;
    modelValue?: boolean;
    /** 标签文本（插槽未提供时使用） */
    text?: string;
    /** 订阅标签文本：挂载时调用，resolve 出的字符串用于渲染，优先级高于 text */
    subscribe?: SubscribeHandler<string>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    type: 'default',
    closable: false,
    modelValue: undefined,
    text: undefined,
    subscribe: undefined,
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<string>(() => props.subscribe);

const effectiveText = computed<string>(() =>
  subState.value.status === 'success' ? (subState.value.data as string) : (props.text ?? ''),
);
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

const { value: visible } = useControllableModel<boolean>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: true,
  fallback: true,
  onChange: (next) => emit('update:modelValue', next),
});

function close() {
  visible.value = false;
  emit('close');
}
</script>

<template>
  <Transition name="cumquat-fade">
    <span v-if="visible" class="cumquat-tag" :class="`cumquat-tag--${type}`">
      <slot>{{ effectiveText }}</slot>
      <button
        v-if="closable"
        type="button"
        aria-label="关闭"
        class="cumquat-tag__close"
        @click="close"
      >
        <svg
          class="cumquat-tag__close-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  </Transition>

  <p v-if="errorText" class="cumquat-tag__error cq-state--error" role="alert">
    {{ errorText }}
  </p>
</template>
