<script setup lang="ts">
import { computed, nextTick } from 'vue';
import { useFloating, useListboxNavigation, usePopoverModel } from '@cumquat/composables';
import type { Placement, PopoverTrigger } from '@cumquat/composables';

export interface DropdownItem {
  key: string;
  label: string;
  disabled?: boolean;
  /** 渲染为分隔线（其余字段忽略） */
  divider?: boolean;
}

const props = withDefaults(
  defineProps<{
    /** 数据驱动菜单项；不传时使用默认插槽 */
    items?: DropdownItem[];
    trigger?: PopoverTrigger;
    placement?: Placement;
    open?: boolean;
    disabled?: boolean;
  }>(),
  {
    items: () => [],
    trigger: 'click',
    placement: 'bottom-start',
    open: undefined,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [item: DropdownItem];
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
  modelValue: props.open !== undefined ? () => props.open : undefined,
  onChange: (next) => emit('update:open', next),
});

const { referenceRef, floatingRef, floatingStyles, update } = useFloating({
  placement: () => props.placement,
  gap: 6,
  open: isOpen,
});

const enabledItems = computed(() => props.items.filter((item) => !item.divider && !item.disabled));

const nav = useListboxNavigation({
  count: computed(() => enabledItems.value.length),
  isItemDisabled: () => false,
  onSelect: (index) => {
    const item = enabledItems.value[index];
    if (item) pick(item);
  },
});

function pick(item: DropdownItem) {
  if (item.disabled) return;
  emit('select', item);
  close();
}

function onToggle() {
  triggerProps.value.onClick?.();
  void nextTick().then(update);
}

defineExpose({ open: setOpen, close, toggle });
</script>

<template>
  <div class="cumquat-dropdown">
    <div
      ref="referenceRef"
      class="cumquat-dropdown__trigger"
      @click="onToggle"
      @mouseenter="triggerProps.onMouseenter?.()"
      @mouseleave="triggerProps.onMouseleave?.()"
    >
      <slot name="trigger" />
    </div>
    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        role="menu"
        class="cumquat-dropdown__menu"
        :style="floatingStyles"
        @mouseenter="floatingHoverProps.onMouseenter?.()"
        @mouseleave="floatingHoverProps.onMouseleave?.()"
        @keydown="nav.onKeydown"
      >
        <template v-if="items.length">
          <template
            v-for="(item, index) in items"
            :key="item.divider ? `divider-${index}` : item.key"
          >
            <span v-if="item.divider" class="cumquat-dropdown__divider" />
            <button
              v-else
              type="button"
              role="menuitem"
              class="cumquat-dropdown__item"
              :class="[
                item.disabled ? 'cumquat-dropdown__item--disabled' : '',
                nav.activeIndex.value === enabledItems.indexOf(item)
                  ? 'cumquat-dropdown__item--hover'
                  : '',
              ]"
              :disabled="item.disabled"
              @click="pick(item)"
              @mousemove="nav.setActiveIndex(enabledItems.indexOf(item))"
            >
              {{ item.label }}
            </button>
          </template>
        </template>
        <slot v-else />
      </div>
    </Transition>
  </div>
</template>
