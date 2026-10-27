<script setup lang="ts">
import { useActionState, useFloating, usePopoverModel } from '@cumquat/composables';
import type { ActionLike, Placement } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';

const props = withDefaults(
  defineProps<{
    /** 确认气泡文案 */
    text?: string;
    confirmText?: string;
    cancelText?: string;
    placement?: Placement;
    open?: boolean;
    /** 点击确认时执行的异步动作，执行期间按钮进入 loading/禁用态 */
    action?: ActionLike;
    disabled?: boolean;
  }>(),
  {
    text: '确定执行该操作吗？',
    confirmText: '确定',
    cancelText: '取消',
    placement: 'top',
    open: undefined,
    action: undefined,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const {
  isOpen,
  open: setOpen,
  close,
  toggle,
  triggerProps,
} = usePopoverModel({
  trigger: 'click',
  modelValue: props.open !== undefined ? () => props.open : undefined,
  onChange: (next) => emit('update:open', next),
});

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: () => props.placement,
  gap: 10,
  open: isOpen,
});

const { pending, run } = useActionState(async () => props.action?.(), {
  disableOnPending: true,
});

async function confirm() {
  await run();
  close();
  emit('confirm');
}

function cancel() {
  close();
  emit('cancel');
}

defineExpose({ open: setOpen, close, toggle });
</script>

<template>
  <span class="cumquat-popconfirm">
    <span ref="referenceRef" class="cumquat-popconfirm__trigger" @click="triggerProps.onClick?.()">
      <slot />
    </span>
    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        role="alertdialog"
        class="cumquat-popconfirm__content"
        :class="`cumquat-popconfirm__content--${placement.split('-')[0]}`"
        :style="floatingStyles"
      >
        <span class="cumquat-popconfirm__arrow" />
        <p class="cumquat-popconfirm__text">{{ text }}</p>
        <div class="cumquat-popconfirm__actions">
          <CqButton
            size="sm"
            class="cumquat-popconfirm__cancel"
            :disabled="pending"
            @click="cancel"
          >
            {{ cancelText }}
          </CqButton>
          <CqButton
            size="sm"
            type="primary"
            class="cumquat-popconfirm__ok"
            :loading="pending"
            @click="confirm"
          >
            {{ confirmText }}
          </CqButton>
        </div>
      </div>
    </Transition>
  </span>
</template>
