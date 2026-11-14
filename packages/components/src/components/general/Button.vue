<script setup lang="ts">
import { computed, toValue } from 'vue';
import type { ActionHandler } from '@cumquat/core';
import { asyncErrorText } from '@cumquat/core';

import type { MountTarget } from '@cumquat/composables';
import { useActionState, useId, message } from '@cumquat/composables';

import { useCumquatConfig } from '../../config';

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
    action?: ActionHandler;
    /** 动作完成后是否弹出 toast 提示，默认 false（Dialog 等上层容器会自行展示错误） */
    toast?: boolean;
    /** toast 成功文案，不传时兜底"操作成功" */
    successText?: string;
    /** 该按钮 toast 的挂载目标，优先于 ConfigProvider 和应用配置 */
    toastTarget?: MountTarget;
    id?: string;
  }>(),
  {
    type: 'secondary',
    size: 'md',
    disabled: false,
    loading: false,
    block: false,
    action: undefined,
    toast: false,
    successText: undefined,
    toastTarget: undefined,
    id: undefined,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const uid = useId('cq-button');
const config = useCumquatConfig();

const { pending, run } = useActionState(props.action, {
  disabled: () => props.disabled || props.loading,
  onSuccess: (result) => {
    if (!props.toast) return;
    const custom =
      result && typeof result === 'object' && 'message' in result
        ? toValue((result as { message?: string | undefined }).message)
        : undefined;
    const text =
      (typeof custom === 'string' && custom ? custom : undefined) ??
      props.successText ??
      '操作成功';
    message.push(text, {
      type: 'success',
      target: props.toastTarget ?? config.value.overlay?.appendTo,
    });
  },
  onError: (err: unknown) => {
    if (!props.toast) return;
    message.push(asyncErrorText(err), {
      type: 'error',
      duration: 5000,
      target: props.toastTarget ?? config.value.overlay?.appendTo,
    });
  },
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
