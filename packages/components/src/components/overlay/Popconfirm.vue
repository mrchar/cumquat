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
  <span class="cumquat-popconfirm">
    <span class="cumquat-popconfirm__trigger" @click="open = !open">
      <slot />
    </span>
    <Transition name="cumquat-fade">
      <div v-if="open" role="alertdialog" class="cumquat-popconfirm__content">
        <span class="cumquat-popconfirm__arrow" />
        <p class="cumquat-popconfirm__text">{{ text }}</p>
        <div class="cumquat-popconfirm__actions">
          <button type="button" class="cumquat-popconfirm__cancel" @click="cancel">
            {{ cancelText }}
          </button>
          <button type="button" class="cumquat-popconfirm__ok" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </Transition>
  </span>
</template>
