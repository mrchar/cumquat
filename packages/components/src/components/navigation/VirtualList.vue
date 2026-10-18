<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFetchResource, useResizeObserver, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    items?: string[];
    /** 容器高度（px） */
    height?: number;
    /** 单项高度（px）；动态行高时传函数 */
    itemHeight?: number;
    /** 上下缓冲行数 */
    buffer?: number;
    /** 动态行高：按索引返回高度（px） */
    dynamicHeight?: (item: string, index: number) => number;
    /**
     * 统一远程请求：挂载即拉首页，触底自动以递增 pagination 拉取下一页并累积。
     * 需返回 { list, total } 才能识别是否还有更多；返回数组视为一次性全量。
     */
    fetch?: Fetch<string>;
    /**
     * 订阅数据：挂载时调用，resolve 出的列表项用于渲染。
     * 优先级：subscribe > fetch > items
     */
    subscribe?: SubscribeHandler<string[]>;
  }>(),
  {
    items: () => [],
    height: 240,
    itemHeight: 40,
    buffer: 2,
    dynamicHeight: undefined,
    fetch: undefined,
    subscribe: undefined,
  },
);

const scrollerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);

/* ---------------- fetch：分页累积 ---------------- */
const currentPage = ref(1);

const {
  enabled: fetchEnabled,
  state: fetchState,
  total,
} = useFetchResource<string[]>(() => props.fetch, {
  initialData: [] as string[],
  getQuery: () => ({ pagination: { currentPage: currentPage.value, pageSize: 20 } }),
  // 首页整体替换；翻页追加累积
  merge: (previous, next, query) =>
    (query.pagination?.currentPage ?? 1) <= 1 ? next : [...previous, ...next],
});

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<string[]>(() => props.subscribe);

const sourceItems = computed<string[]>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data ?? [];
  return fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items;
});
const remoteLoading = computed(
  () =>
    (fetchEnabled.value && fetchState.value?.status === 'pending') ||
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
const hasMore = computed(() => total.value > 0 && sourceItems.value.length < total.value);

// 感知容器尺寸变化（视口高度以 props.height 为准，SSR/jsdom 下仍可计算窗口）
useResizeObserver(scrollerRef);

function heightAt(index: number) {
  if (props.dynamicHeight) {
    const item = sourceItems.value[index];
    return item === undefined ? props.itemHeight : props.dynamicHeight(item, index);
  }
  return props.itemHeight;
}

/** 各项的顶部偏移（动态行高下逐项累加） */
const offsets = computed(() => {
  const list = [0];
  for (let i = 0; i < sourceItems.value.length; i += 1) list.push(list[i] + heightAt(i));
  return list;
});

const totalHeight = computed(() => offsets.value[sourceItems.value.length] ?? 0);

/** 二分查找偏移对应的起始索引 */
function findIndex(top: number) {
  let lo = 0;
  let hi = Math.max(0, sourceItems.value.length - 1);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((offsets.value[mid + 1] ?? 0) <= top) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const startIndex = computed(() => Math.max(0, findIndex(scrollTop.value) - props.buffer));

const endIndex = computed(() => {
  const end = findIndex(scrollTop.value + props.height) + props.buffer + 1;
  return Math.min(sourceItems.value.length, end);
});

const visibleItems = computed(() =>
  sourceItems.value.slice(startIndex.value, endIndex.value).map((item, offset) => ({
    item,
    index: startIndex.value + offset,
    top: offsets.value[startIndex.value + offset] ?? 0,
    height: heightAt(startIndex.value + offset),
  })),
);

function loadMore() {
  if (!fetchEnabled.value || remoteLoading.value || !hasMore.value) return;
  currentPage.value += 1;
}

function onScroll(event: Event) {
  scrollTop.value = (event.target as HTMLElement).scrollTop;
  const el = event.target as HTMLElement;
  if (el.scrollTop + props.height >= el.scrollHeight - props.itemHeight * 2) loadMore();
}

function scrollToIndex(index: number) {
  const clamped = Math.min(Math.max(0, index), sourceItems.value.length - 1);
  const el = scrollerRef.value;
  if (el) el.scrollTop = offsets.value[clamped] ?? 0;
  scrollTop.value = offsets.value[clamped] ?? 0;
}

defineExpose({ scrollToIndex });
</script>

<template>
  <div
    ref="scrollerRef"
    class="cumquat-virtual-list"
    :class="
      (fetchEnabled || subscribe) && remoteLoading && sourceItems.length > 0
        ? 'cumquat-virtual-list--stale'
        : ''
    "
    :style="{ height: `${height}px` }"
    @scroll="onScroll"
  >
    <p
      v-if="(fetchEnabled || subscribe) && remoteLoading && sourceItems.length === 0"
      class="cumquat-virtual-list__state cq-state--pending"
    >
      加载中…
    </p>
    <p
      v-else-if="(fetchEnabled || subscribe) && remoteError && sourceItems.length === 0"
      class="cumquat-virtual-list__state cq-state--error"
    >
      加载失败
      <button type="button" class="cumquat-virtual-list__retry" @click="retryRemote">重试</button>
    </p>
    <p
      v-else-if="(fetchEnabled || subscribe) && sourceItems.length === 0"
      class="cumquat-virtual-list__state"
    >
      暂无数据
    </p>
    <ul v-else class="cumquat-virtual-list__inner" :style="{ height: `${totalHeight}px` }">
      <li
        v-for="entry in visibleItems"
        :key="entry.index"
        class="cumquat-virtual-list__item"
        :style="{ height: `${entry.height}px`, transform: `translateY(${entry.top}px)` }"
      >
        <span class="cumquat-virtual-list__index">#{{ entry.index + 1 }}</span>
        {{ entry.item }}
      </li>
    </ul>
    <!-- 触底加载哨兵 -->
    <p
      v-if="(fetchEnabled || subscribe) && sourceItems.length > 0 && remoteLoading"
      class="cumquat-virtual-list__state cq-state--pending cumquat-virtual-list__state--sentinel"
    >
      加载更多…
    </p>
    <p
      v-else-if="(fetchEnabled || subscribe) && sourceItems.length > 0 && remoteError"
      class="cumquat-virtual-list__state cq-state--error cumquat-virtual-list__state--sentinel"
    >
      加载失败
      <button type="button" class="cumquat-virtual-list__retry" @click="retryRemote">重试</button>
    </p>
  </div>
</template>
