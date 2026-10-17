<script setup lang="ts">
/**
 * 命令式消息服务的全局渲染层：
 * 在应用根部挂载一次，`message.success(...)` 等调用即在此堆叠呈现。
 */
import { message } from '@cumquat/composables';
import type { MessageApi } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 可传入自建服务（默认共享全局单例） */
    api?: MessageApi;
  }>(),
  { api: () => message },
);
</script>

<template>
  <Teleport to="body">
    <div class="cumquat-message-container">
      <TransitionGroup name="cumquat-fade">
        <div
          v-for="item in props.api.items.value"
          :key="item.id"
          role="status"
          class="cumquat-message"
          :class="`cumquat-message--${item.type}`"
          @mouseenter="props.api.pause(item.id)"
          @mouseleave="props.api.resume(item.id)"
        >
          <span class="cumquat-message__dot" :class="`cumquat-message__dot--${item.type}`" />
          <span class="cumquat-message__body">{{ item.content }}</span>
          <button
            v-if="item.duration === 0 || item.closable"
            type="button"
            aria-label="关闭"
            class="cumquat-message__close"
            @click="props.api.remove(item.id)"
          >
            <svg
              class="cumquat-message__close-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
