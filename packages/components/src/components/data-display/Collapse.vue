<script setup lang="ts">
import { computed } from 'vue';
import { useControllableModel, useFetchResource, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';

export interface CollapseItem {
  key: string;
  title: string;
  content: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    items?: CollapseItem[];
    /** 当前展开的 key（受控，手风琴模式同样用单元素数组） */
    activeKeys?: string[];
    defaultActiveKeys?: string[];
    /** 手风琴：同时至多展开一个面板 */
    accordion?: boolean;
    /** 统一远程请求：挂载即拉取面板项，返回数组或 { list, total } */
    fetch?: Fetch<CollapseItem>;
    /**
     * 订阅数据：挂载时调用，resolve 出的面板项用于渲染。
     * 优先级：subscribe > fetch > items
     */
    subscribe?: SubscribeHandler<CollapseItem[]>;
  }>(),
  {
    items: () => [],
    activeKeys: undefined,
    defaultActiveKeys: () => [],
    accordion: false,
    fetch: undefined,
    subscribe: undefined,
  },
);

const emit = defineEmits<{
  'update:activeKeys': [keys: string[]];
  change: [keys: string[]];
}>();

const { value: activeSet } = useControllableModel<string[]>({
  modelValue: props.activeKeys !== undefined ? () => props.activeKeys : undefined,
  defaultValue: props.defaultActiveKeys,
  fallback: [],
  onChange: (keys) => {
    emit('update:activeKeys', keys);
    emit('change', keys);
  },
});

const isActive = (key: string) => activeSet.value.includes(key);

function toggle(item: CollapseItem) {
  if (item.disabled) return;
  if (isActive(item.key)) {
    activeSet.value = activeSet.value.filter((key) => key !== item.key);
  } else if (props.accordion) {
    activeSet.value = [item.key];
  } else {
    activeSet.value = [...activeSet.value, item.key];
  }
}

/* ---------------- fetch：挂载即拉面板项 ---------------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<CollapseItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as CollapseItem[] },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<CollapseItem[]>(() => props.subscribe);

const sourceItems = computed<CollapseItem[]>(() => {
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
  <div class="cumquat-collapse">
    <p
      v-if="remoteLoading && sourceItems.length === 0"
      class="cumquat-collapse__state cq-state--pending"
    >
      加载中…
    </p>
    <p
      v-else-if="remoteError && sourceItems.length === 0"
      class="cumquat-collapse__state cq-state--error"
    >
      加载失败
      <button type="button" class="cumquat-collapse__retry" @click="retryRemote">重试</button>
    </p>
    <p v-else-if="sourceItems.length === 0" class="cumquat-collapse__state">暂无数据</p>
    <div v-for="item in sourceItems" :key="item.key" class="cumquat-collapse__item">
      <button
        type="button"
        class="cumquat-collapse__header"
        :class="item.disabled ? 'cumquat-collapse__header--disabled' : ''"
        :aria-expanded="isActive(item.key)"
        :disabled="item.disabled"
        @click="toggle(item)"
      >
        {{ item.title }}
        <svg
          class="cumquat-collapse__chevron"
          :class="isActive(item.key) ? 'cumquat-collapse__chevron--expanded' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <!-- 高度自适应过渡：进场使用 grid-rows 动画，离场即时移除 -->
      <div
        v-if="isActive(item.key)"
        class="cumquat-collapse__content-wrap cumquat-collapse__content-wrap--in"
      >
        <div class="cumquat-collapse__content">
          {{ item.content }}
        </div>
      </div>
    </div>
  </div>
</template>
