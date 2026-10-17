<script setup lang="ts">
/**
 * 命令式通知服务的全局渲染层：在应用根部挂载一次，
 * `notification.success(...)` 等调用即按角落方向堆叠呈现。
 */
import { computed } from 'vue';
import { notification } from '@cumquat/composables';
import type { NotificationApi } from '@cumquat/composables';

type Placement = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

const props = withDefaults(
  defineProps<{
    /** 可传入自建服务（默认共享全局单例） */
    api?: NotificationApi;
    placement?: Placement;
  }>(),
  { api: () => notification, placement: 'top-right' },
);

type Entry = NotificationApi['items']['value'][number];

const groups = computed(() => {
  const map = new Map<Placement, Entry[]>();
  for (const item of props.api.items.value) {
    const key = (item.meta?.placement ?? props.placement) as Placement;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return Array.from(map, ([placement, items]) => ({ placement, items }));
});
</script>

<template>
  <Teleport to="body">
    <div
      v-for="group in groups"
      :key="group.placement"
      class="cumquat-notification-container"
      :class="`cumquat-notification-container--${group.placement}`"
    >
      <TransitionGroup name="cumquat-fade">
        <div
          v-for="item in group.items"
          :key="item.id"
          role="status"
          class="cumquat-notification"
          :class="`cumquat-notification--${item.type}`"
        >
          <div class="cumquat-notification__inner">
            <span
              class="cumquat-notification__dot"
              :class="`cumquat-notification__dot--${item.type}`"
            />
            <div class="cumquat-notification__body">
              <p class="cumquat-notification__title">{{ item.title }}</p>
              <div v-if="item.description" class="cumquat-notification__content">
                {{ item.description }}
              </div>
            </div>
            <button
              type="button"
              aria-label="关闭"
              class="cumquat-notification__close"
              @click="props.api.remove(item.id)"
            >
              <svg
                class="cumquat-notification__close-icon"
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
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
