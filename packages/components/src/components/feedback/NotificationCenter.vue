<script setup lang="ts">
import { computed, ref } from 'vue';
import type { NotificationCenterItem, UseNotificationCenterReturn } from '@cumquat/composables';
import { useClickOutside, useControllableModel, useFloating } from '@cumquat/composables';

/**
 * 消息盒子：铃铛入口 + 未读徽标 + 消息列表。
 *
 * 数据全部由 useNotificationCenter 提供，服务端推送（WebSocket / SSE / 轮询）
 * 由宿主在回调里直接调用 `api.push(...)`；点击消息会标记已读并派发 select。
 */
const props = withDefaults(
  defineProps<{
    /** useNotificationCenter 的返回值 */
    api: UseNotificationCenterReturn;
    /** 面板开合（v-model:open），不绑定时组件内部自持 */
    open?: boolean;
    /** 面板标题 */
    title?: string;
    /** 空态文案 */
    emptyText?: string;
    /** 面板宽度 */
    width?: string;
    /** 列表最大高度，超出滚动 */
    maxHeight?: string;
    /** 面板相对铃铛的水平对齐 */
    placement?: 'bottom-end' | 'bottom-start';
    disabled?: boolean;
  }>(),
  {
    open: undefined,
    title: '通知',
    emptyText: '暂无通知',
    width: '22rem',
    maxHeight: '24rem',
    placement: 'bottom-end',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  /** 点击消息：已标记已读，宿主可据此跳转 */
  select: [item: NotificationCenterItem];
}>();

const { value: openState } = useControllableModel<boolean>({
  modelValue: props.open !== undefined ? () => props.open : undefined,
  defaultValue: false,
  fallback: false,
  onChange: (next) => emit('update:open', next),
});

const rootRef = ref<HTMLElement>();

// 面板 Teleport 到 body 并用 fixed 定位：避免被 LiveDemo、卡片等 overflow 祖先裁切
const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: () => props.placement,
  strategy: 'fixed',
  gap: 8,
  open: () => openState.value,
});

useClickOutside(
  rootRef,
  () => {
    openState.value = false;
  },
  { enabled: () => openState.value, ignore: () => [floatingRef.value] },
);

const badgeText = computed(() =>
  props.api.unreadCount.value > 99 ? '99+' : String(props.api.unreadCount.value),
);

const toggle = () => {
  if (props.disabled) return;
  openState.value = !openState.value;
};

const select = (item: NotificationCenterItem) => {
  props.api.markRead(item.id);
  emit('select', item);
};

/** 相对时间：刚刚 / n 分钟前 / 今日时刻 / 月-日 时刻 */
function formatTime(time: number): string {
  const diff = Date.now() - time;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  const date = new Date(time);
  const now = new Date();
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (date.toDateString() === now.toDateString()) return `${hh}:${mm}`;
  return `${date.getMonth() + 1}-${date.getDate()} ${hh}:${mm}`;
}

const panelStyle = computed(() => ({ ...floatingStyles.value, width: props.width }));
const listStyle = computed(() => ({ maxHeight: props.maxHeight }));
</script>

<template>
  <div
    ref="rootRef"
    class="cumquat-notification-center"
    :class="disabled ? 'cumquat-notification-center--disabled' : ''"
    @keydown.esc="openState = false"
  >
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-notification-center__trigger"
      :disabled="disabled"
      aria-label="通知"
      aria-haspopup="dialog"
      :aria-expanded="openState"
      @click="toggle"
    >
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M10 3a4.5 4.5 0 0 0-4.5 4.5v3L3.8 13.4a.6.6 0 0 0 .5.9h11.4a.6.6 0 0 0 .5-.9L14.5 10.5v-3A4.5 4.5 0 0 0 10 3Z"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
      <span v-if="api.unreadCount.value > 0" class="cumquat-notification-center__badge" aria-hidden="true">
        {{ badgeText }}
      </span>
    </button>

    <Teleport to="body">
      <Transition name="cumquat-fade">
        <section
          ref="floatingRef"
          v-if="openState"
          class="cumquat-notification-center__panel"
          role="dialog"
          :aria-label="title"
          :style="panelStyle"
        >
        <header class="cumquat-notification-center__header">
          <p class="cumquat-notification-center__title">{{ title }}</p>
          <div class="cumquat-notification-center__actions">
            <span class="cumquat-notification-center__summary">
              {{ api.unreadCount.value > 0 ? `${api.unreadCount.value} 条未读` : '全部已读' }}
            </span>
            <button
              type="button"
              class="cumquat-notification-center__read-all"
              :disabled="!api.hasUnread.value"
              @click="api.markAllRead()"
            >
              全部已读
            </button>
          </div>
        </header>

        <div v-if="!api.items.value.length" class="cumquat-notification-center__empty">
          {{ emptyText }}
        </div>
        <ul v-else class="cumquat-notification-center__list" :style="listStyle">
          <li
            v-for="item in api.items.value"
            :key="item.id"
            class="cumquat-notification-center__item"
            :class="item.read ? '' : 'cumquat-notification-center__item--unread'"
          >
            <button type="button" class="cumquat-notification-center__item-main" @click="select(item)">
              <span class="cumquat-notification-center__item-title">
                <span
                  class="cumquat-notification-center__dot"
                  :class="`cumquat-notification-center__dot--${item.type}`"
                  aria-hidden="true"
                />
                <span class="cumquat-notification-center__item-text">{{ item.title }}</span>
              </span>
              <span v-if="item.description" class="cumquat-notification-center__item-description">
                {{ item.description }}
              </span>
              <span class="cumquat-notification-center__item-time">{{ formatTime(item.time) }}</span>
            </button>
            <button
              type="button"
              class="cumquat-notification-center__remove"
              :aria-label="`删除通知 ${item.title}`"
              @click="api.remove(item.id)"
            >
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              </svg>
            </button>
          </li>
        </ul>
        </section>
      </Transition>
    </Teleport>
  </div>
</template>
