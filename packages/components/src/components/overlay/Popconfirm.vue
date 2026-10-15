<script setup lang="ts">
import { ref } from 'vue';

withDefaults(
  defineProps<{
    /** 确认气泡文案 */
    text?: string;
    confirmText?: string;
    cancelText?: string;
  }>(),
  { text: '确定执行该操作吗？', confirmText: '确定', cancelText: '取消' },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const open = ref(false);

function confirm() {
  open.value = false;
  emit('confirm');
}

function cancel() {
  open.value = false;
  emit('cancel');
}
</script>

<template>
  <span class="cumquat-popconfirm relative inline-block">
    <span class="cumquat-popconfirm__trigger inline-flex" @click="open = !open">
      <slot />
    </span>
    <Transition name="cumquat-fade">
      <div
        v-if="open"
        role="alertdialog"
        class="cumquat-popconfirm__content absolute left-1/2 bottom-full z-20 mb-2 w-60 -translate-x-1/2 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-3 text-sm shadow-cumquat-overlay"
      >
        <span
          class="cumquat-popconfirm__arrow absolute left-1/2 -bottom-1.5 size-3 -translate-x-1/2 rotate-45 border-r border-b border-cumquat-border bg-cumquat-surface"
        />
        <p class="cumquat-popconfirm__text text-cumquat-text">{{ text }}</p>
        <div class="cumquat-popconfirm__actions mt-2.5 flex justify-end gap-2">
          <button
            type="button"
            class="cumquat-popconfirm__cancel cursor-pointer rounded-cumquat border border-cumquat-border px-2.5 py-1 text-xs text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
            @click="cancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="cumquat-popconfirm__ok cursor-pointer rounded-cumquat bg-cumquat-accent px-2.5 py-1 text-xs text-cumquat-text-inverse transition-colors hover:bg-cumquat-accent-hover"
            @click="confirm"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </Transition>
  </span>
</template>
