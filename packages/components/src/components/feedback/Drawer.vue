<script setup lang="ts">
import type { ActionHandler } from '@cumquat/core';
import { asyncErrorText } from '@cumquat/core';
import type { MountTarget } from '@cumquat/composables';
import { useActionState, useModal, useOverlayContainer } from '@cumquat/composables';
import { computed } from 'vue';
import CqButton from '../general/Button.vue';

import { useCumquatConfig } from '../../config';

const props = withDefaults(
  defineProps<{
    /** v-model:open 控制开合 */
    open?: boolean;
    title?: string;
    /** 滑出方向 */
    direction?: 'left' | 'right' | 'top' | 'bottom';
    /** 滑出轴尺寸（左右滑出为宽度，上下滑出为高度） */
    size?: string;
    /** 面板宽度：缺省时左右滑出取 size，上下滑出铺满 */
    width?: string;
    /** 面板高度：缺省时上下滑出取 size，左右滑出铺满 */
    height?: string;
    /** 非滑出轴对齐：上下滑出控制水平位置，左右滑出控制垂直位置 */
    align?: 'start' | 'center' | 'end';
    closable?: boolean;
    maskClosable?: boolean;
    escClosable?: boolean;
    lockScroll?: boolean;
    /** Teleport 目标；未传时继承 ConfigProvider 或应用配置，默认 body */
    appendTo?: MountTarget;
    /** 确认动作：未提供 footer 插槽时渲染默认底部按钮，动作失败保持打开并展示错误提示 */
    action?: ActionHandler;
    /** 默认底部确认按钮文案 */
    confirmText?: string;
    /** 默认底部取消按钮文案 */
    cancelText?: string;
    /** 动作失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    open: false,
    title: '',
    direction: 'right',
    size: '24rem',
    width: undefined,
    height: undefined,
    align: 'center',
    closable: true,
    maskClosable: true,
    escClosable: true,
    lockScroll: true,
    appendTo: undefined,
    action: undefined,
    confirmText: '确认',
    cancelText: '取消',
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  open: [];
  close: [];
  /** 确认动作成功后触发（无 action 时点击确认即触发） */
  confirm: [];
  /** 默认底部取消按钮点击后触发 */
  cancel: [];
  /** 确认动作失败（reject 或返回值导出错误）时触发 */
  actionError: [error: unknown];
}>();

const {
  pending,
  error: actionError,
  run,
} = useActionState(() => props.action?.(), {
  onError: (err) => emit('actionError', err),
});

/** 确认：有 action 时执行并等待，成功才关闭；失败保持打开并展示错误条 */
async function handleConfirm() {
  if (pending.value) return;
  if (props.action) {
    await run();
    if (actionError.value != null) return;
  }
  emit('confirm');
  close();
}

function handleCancel() {
  if (pending.value) return;
  emit('cancel');
  close();
}

const errorText = computed(() =>
  actionError.value != null ? asyncErrorText(actionError.value, props.errorText) : null,
);

const {
  isOpen,
  open: setOpen,
  close,
  contentRef,
  rendered,
  onAfterLeave,
  zIndex,
  onMaskClick,
} = useModal({
  modelValue: props.open !== undefined ? () => props.open : undefined,
  maskClosable: props.maskClosable,
  escClosable: props.escClosable,
  lockScroll: props.lockScroll,
  onChange: (next) => emit('update:open', next),
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
});

const config = useCumquatConfig();
const { container } = useOverlayContainer({
  to: () => props.appendTo ?? config.value.overlay?.appendTo,
});
const teleportTarget = computed<MountTarget>(() => container.value ?? 'body');

/** 非滑出轴对齐：start 贴起始边，center 居中，end 贴结束边（自动外边距实现，不干扰滑入位移） */
function crossAlign(axis: 'x' | 'y', align: 'start' | 'center' | 'end') {
  if (axis === 'x') {
    if (align === 'start') return { left: '0', right: 'auto' };
    if (align === 'end') return { left: 'auto', right: '0' };
    return { left: '0', right: '0', marginLeft: 'auto', marginRight: 'auto' };
  }
  if (align === 'start') return { top: '0', bottom: 'auto' };
  if (align === 'end') return { top: 'auto', bottom: '0' };
  return { top: '0', bottom: '0', marginTop: 'auto', marginBottom: 'auto' };
}

const panelStyle = computed<Record<string, string>>(() => {
  const horizontal = props.direction === 'left' || props.direction === 'right';
  const width = props.width ?? (horizontal ? props.size : '100%');
  const height = props.height ?? (horizontal ? '100%' : props.size);
  return horizontal
    ? { width, height, ...crossAlign('y', props.align) }
    : { width, height, ...crossAlign('x', props.align) };
});

defineExpose({ open: setOpen, close });
</script>

<template>
  <Teleport :to="teleportTarget">
    <Transition name="cumquat-drawer" @after-leave="onAfterLeave">
      <div
        v-if="rendered"
        v-show="isOpen"
        class="cumquat-drawer"
        :class="`cumquat-drawer--${direction}`"
        :style="{ zIndex }"
      >
        <div class="cumquat-drawer__mask" @click="onMaskClick" />
        <aside
          ref="contentRef"
          role="dialog"
          aria-modal="true"
          class="cumquat-drawer__panel"
          :style="panelStyle"
        >
          <header v-if="title || closable" class="cumquat-drawer__header">
            <h3 class="cumquat-drawer__title">{{ title }}</h3>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-drawer__close"
              @click="close"
            >
              <svg
                class="cumquat-drawer__close-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>
          <div class="cumquat-drawer__body">
            <slot />
            <p v-if="errorText" class="cumquat-drawer__error cq-state--error" role="alert">
              {{ errorText }}
            </p>
          </div>
          <footer v-if="$slots.footer" class="cumquat-drawer__footer">
            <slot name="footer" />
          </footer>
          <footer v-else-if="action" class="cumquat-drawer__footer">
            <CqButton :disabled="pending" @click="handleCancel">{{ cancelText }}</CqButton>
            <CqButton type="primary" :loading="pending" @click="handleConfirm">
              {{ confirmText }}
            </CqButton>
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>