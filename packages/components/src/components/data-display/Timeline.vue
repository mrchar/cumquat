<script setup lang="ts">
import { computed } from 'vue';
import { useFetchResource } from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

export interface TimelineItem {
  key: string;
  title: string;
  content?: string;
  time?: string;
  /** 节点颜色 */
  type?: 'primary' | 'success' | 'warning' | 'danger';
}

const props = withDefaults(
  defineProps<{
    items?: TimelineItem[];
    /**
     * 统一远程请求：挂载即拉取时间轴项，
     * 返回数组或 { list, total }
     */
    fetch?: Fetch<TimelineItem>;
  }>(),
  { items: () => [], fetch: undefined },
);

const { enabled: fetchEnabled, state: fetchState } = useFetchResource<TimelineItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as TimelineItem[] },
);

const sourceItems = computed<TimelineItem[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items,
);
const remoteLoading = computed(() => fetchState.value?.status === 'pending');
const remoteError = computed(() =>
  fetchState.value?.status === 'error' ? fetchState.value.error : undefined,
);
</script>

<template>
  <ol class="cumquat-timeline">
    <li
      v-if="remoteLoading && sourceItems.length === 0"
      class="cumquat-timeline__state cq-state--pending"
    >
      加载中…
    </li>
    <li
      v-else-if="remoteError && sourceItems.length === 0"
      class="cumquat-timeline__state cq-state--error"
    >
      加载失败
      <button type="button" class="cumquat-timeline__retry" @click="fetchState?.retry?.()">
        重试
      </button>
    </li>
    <li v-else-if="sourceItems.length === 0" class="cumquat-timeline__state">暂无数据</li>
    <li v-for="(item, index) in sourceItems" :key="item.key" class="cumquat-timeline__item">
      <!-- 纵向连线 -->
      <span v-if="index < sourceItems.length - 1" class="cumquat-timeline__line" />
      <span
        class="cumquat-timeline__dot"
        :class="`cumquat-timeline__dot--${item.type ?? 'primary'}`"
      />
      <div class="cumquat-timeline__body">
        <div class="cumquat-timeline__heading">
          <h4 class="cumquat-timeline__title">{{ item.title }}</h4>
          <span v-if="item.time" class="cumquat-timeline__time">{{ item.time }}</span>
        </div>
        <p v-if="item.content" class="cumquat-timeline__content">{{ item.content }}</p>
        <div v-if="$slots.default" class="cumquat-timeline__extra">
          <slot :item="item" :index="index" />
        </div>
      </div>
    </li>
  </ol>
</template>
