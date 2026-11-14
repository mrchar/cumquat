<script setup lang="ts">
import { computed } from 'vue';
import type { MessageApi, MountTarget } from '@cumquat/composables';
import { message } from '@cumquat/composables';
/**
 * 命令式消息服务的全局渲染层：
 * 在应用根部挂载一次，`message.success(...)` 等调用即在此堆叠呈现。
 */

import { useCumquatConfig } from '../../config';

const props = withDefaults(
  defineProps<{
    /** 可传入自建服务（默认共享全局单例） */
    api?: MessageApi;
    /** 默认 Teleport 目标；消息自身 target 优先，未传时继承配置 */
    target?: MountTarget;
  }>(),
  { api: () => message, target: undefined },
);

type Entry = MessageApi['items']['value'][number];

const config = useCumquatConfig();
const targetIds = new WeakMap<HTMLElement, number>();
let nextTargetId = 0;

/** 将选择器解析为元素，统一归并 body 回退，避免同一目标重复渲染容器 */
function resolveMountTarget(target?: MountTarget): MountTarget {
  if (typeof document === 'undefined') return target ?? 'body';
  if (!target) return document.body;
  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target) ?? document.body;
  }
  return target;
}

function targetKey(target: MountTarget): string | number {
  if (typeof target === 'string') return target;
  let id = targetIds.get(target);
  if (id === undefined) {
    id = ++nextTargetId;
    targetIds.set(target, id);
  }
  return id;
}

/** 每条消息的 target 优先，其次为容器局部属性、Provider / 应用配置、body */
const groups = computed(() => {
  const map = new Map<MountTarget, Entry[]>();
  const inheritedTarget = props.target ?? config.value.overlay?.appendTo;
  for (const item of props.api.items.value) {
    const target = resolveMountTarget(item.target ?? inheritedTarget);
    const list = map.get(target) ?? [];
    list.push(item);
    map.set(target, list);
  }
  return Array.from(map, ([target, items]) => ({ key: targetKey(target), target, items }));
});

/** ToastType → CSS 修饰类名（与 Message.vue 保持一致：'error'→'danger'，'loading'→'info'） */
function typeClass(type: string): string {
  if (type === 'error') return 'danger';
  if (type === 'loading') return 'info';
  return type;
}
</script>

<template>
  <Teleport v-for="group in groups" :key="group.key" :to="group.target">
    <div class="cumquat-message-container">
      <TransitionGroup name="cumquat-fade">
        <div
          v-for="item in group.items"
          :key="item.id"
          role="status"
          class="cumquat-message"
          :class="`cumquat-message--${typeClass(item.type)}`"
          @mouseenter="props.api.pause(item.id)"
          @mouseleave="props.api.resume(item.id)"
        >
          <span class="cumquat-message__dot" :class="`cumquat-message__dot--${typeClass(item.type)}`" />
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