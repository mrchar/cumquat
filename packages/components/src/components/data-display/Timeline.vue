<script setup lang="ts">
import { computed } from 'vue';
import { useFetchResource, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';

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
    /**
     * 订阅数据：挂载时调用，resolve 出的时间轴项用于渲染。
     * 优先级：subscribe > fetch > items
     */
    subscribe?: SubscribeHandler<TimelineItem[]>;
  }>(),
  { items: () => [], fetch: undefined, subscribe: undefined },
);

const { enabled: fetchEnabled, state: fetchState } = useFetchResource<TimelineItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as TimelineItem[] },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<TimelineItem[]>(() => props.subscribe);

const sourceItems = computed<TimelineItem[]>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data ?? [];
  return fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items;
});
const remoteLoading = computed(
  () =>
    fetchState.value?.status === 'pending' ||
    (!!props.subscribe && subState.value.status === 'pending'),
);
const remoteError = computed(() => {
  if (props.subscribe && subState.value.status === 'error') return subState.value.error;
  return fetchState.value?.status === 'error' ? fetchState.value.error : undefined;
});

function retryRemote() {
  if (props.subscribe && subState.value.status === 'error') subState.value.retry?.();
  else fetchState.value?.retry?.();
}
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
      <CqButton size="sm" type="ghost" class="cumquat-timeline__retry" @click="retryRemote">重试</CqButton>
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
