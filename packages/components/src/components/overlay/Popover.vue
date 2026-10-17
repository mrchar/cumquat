<script setup lang="ts">
import { useFloating, usePopoverModel } from '@cumquat/composables';
import type { Placement, PopoverTrigger } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    title?: string;
    trigger?: PopoverTrigger;
    placement?: Placement;
    open?: boolean;
    openDelay?: number;
    closeDelay?: number;
    disabled?: boolean;
  }>(),
  {
    title: '',
    trigger: 'click',
    placement: 'top',
    open: undefined,
    openDelay: 100,
    closeDelay: 100,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const {
  isOpen,
  open: setOpen,
  close,
  toggle,
  triggerProps,
  floatingHoverProps,
} = usePopoverModel({
  trigger: props.trigger,
  openDelay: props.openDelay,
  closeDelay: props.closeDelay,
  modelValue: props.open !== undefined ? () => props.open : undefined,
  onChange: (next) => emit('update:open', next),
});

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: () => props.placement,
  gap: 10,
  open: isOpen,
});

defineExpose({ open: setOpen, close, toggle });
</script>

<template>
  <span class="cumquat-popover">
    <span
      ref="referenceRef"
      class="cumquat-popover__trigger"
      @click="triggerProps.onClick?.()"
      @mouseenter="triggerProps.onMouseenter?.()"
      @mouseleave="triggerProps.onMouseleave?.()"
      @focus="triggerProps.onFocus?.()"
      @blur="triggerProps.onBlur?.()"
    >
      <slot name="trigger" />
    </span>
    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="cumquat-popover__content"
        :class="`cumquat-popover__content--${placement.split('-')[0]}`"
        :style="floatingStyles"
        @mouseenter="floatingHoverProps.onMouseenter?.()"
        @mouseleave="floatingHoverProps.onMouseleave?.()"
      >
        <span class="cumquat-popover__arrow" />
        <h4 v-if="title" class="cumquat-popover__title">{{ title }}</h4>
        <div class="cumquat-popover__body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="cumquat-popover__footer">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </Transition>
  </span>
</template>
