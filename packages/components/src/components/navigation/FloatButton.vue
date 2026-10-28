<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { useOpen, useToggle } from '@cumquat/composables';

export interface FloatAction {
  key: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    actions?: FloatAction[];
    /** 受控展开态 */
    open?: boolean;
    /** 展开方向 */
    placement?: 'top' | 'left';
    /** 挂载到最近定位祖先（absolute 定位）而非视口，用于局部容器演示 */
    mount?: boolean;
  }>(),
  { actions: () => [], open: undefined, placement: 'top', mount: false },
);

const emit = defineEmits<{
  'update:open': [open: boolean];
  select: [key: string];
}>();

// useToggle 承担非受控内部态；useOpen 统一受控/非受控开合
const toggler = useToggle(false);
const isControlled = computed(() => props.open !== undefined);
const stateModel = computed(() => (isControlled.value ? Boolean(props.open) : toggler.value.value));

const { isOpen, toggle, close } = useOpen({
  modelValue: stateModel,
  onChange: (next) => {
    if (!isControlled.value) toggler.toggle(next);
    emit('update:open', next);
  },
});

const slots = useSlots();
const hasCustomTrigger = computed(() => !!slots.default);

function select(action: FloatAction) {
  if (action.disabled) return;
  emit('select', action.key);
  close();
}
</script>

<template>
  <div
    class="cumquat-float-button"
    :class="[
      placement === 'left' ? 'cumquat-float-button--left' : '',
      mount ? 'cumquat-float-button--mounted' : '',
    ]"
  >
    <Transition name="cumquat-fade">
      <div v-if="isOpen && actions.length > 0" class="cumquat-float-button__actions">
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          :disabled="action.disabled"
          :aria-label="action.label"
          class="cumquat-float-button__action"
          @click="select(action)"
        >
          <!-- icon-${key} 具名插槽：自定义动作图标；不传渲染文字 label -->
          <slot :name="`icon-${action.key}`">
            <span class="cumquat-float-button__action-text">{{ action.label }}</span>
          </slot>
        </button>
      </div>
    </Transition>

    <button
      type="button"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? '收起操作' : '展开操作'"
      class="cumquat-float-button__trigger"
      :class="hasCustomTrigger ? 'cumquat-float-button__trigger--custom' : ''"
      @click="toggle()"
    >
      <!-- 默认插槽：自定义触发按钮内容（图标/文字/图片），不传渲染默认加号 -->
      <slot>
        <svg
          class="cumquat-float-button__icon"
          :class="isOpen ? 'cumquat-float-button__icon--expanded' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </slot>
    </button>
  </div>
</template>
