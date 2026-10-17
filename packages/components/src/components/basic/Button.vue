<script setup lang="ts">
import { computed } from 'vue';
import { useActionState, useId } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 按钮语义类型 */
    type?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    /** 外部直接指定加载态 */
    loading?: boolean;
    /** 是否撑满一行 */
    block?: boolean;
    /** 传入动作后，点击自动执行并派生 loading/disabled */
    action?: ActionLike;
    id?: string;
  }>(),
  {
    type: 'secondary',
    size: 'md',
    disabled: false,
    loading: false,
    block: false,
    action: undefined,
    id: undefined,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const uid = useId('cq-button');

const { pending, run } = useActionState(props.action, {
  disabled: () => props.disabled || props.loading,
});

const mergedLoading = computed(() => props.loading || pending.value);
const mergedDisabled = computed(() => props.disabled || mergedLoading.value);

async function onClick(event: MouseEvent) {
  emit('click', event);
  if (props.action && !mergedDisabled.value) {
    await run(event);
  }
}
</script>

<template>
  <button
    :id="id ?? uid"
    class="cumquat-button"
    :class="[
      `cumquat-button--${type}`,
      `cumquat-button--${size}`,
      block ? 'cumquat-button--block' : '',
    ]"
    :disabled="mergedDisabled"
    :aria-busy="mergedLoading || undefined"
    @click="onClick"
  >
    <svg
      v-if="mergedLoading"
      class="cumquat-button__spinner"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
    >
      <circle cx="12" cy="12" r="9" class="cumquat-button__spinner-track" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
