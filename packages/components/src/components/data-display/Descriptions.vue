<script setup lang="ts">
import { computed } from 'vue';
import { useFetchResource, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';

export interface DescriptionItem {
  label: string;
  value: string;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    items?: DescriptionItem[];
    /** 单元格是否带边框 */
    bordered?: boolean;
    /** 每行列数 */
    column?: number;
    /**
     * 统一远程请求：挂载即拉取键值对项，
     * 返回数组或 { list, total }
     */
    fetch?: Fetch<DescriptionItem>;
    /**
     * 订阅数据：挂载时调用，resolve 出的描述项用于渲染。
     * 优先级：subscribe > fetch > items
     */
    subscribe?: SubscribeHandler<DescriptionItem[]>;
  }>(),
  {
    title: '',
    items: () => [],
    bordered: false,
    column: 2,
    fetch: undefined,
    subscribe: undefined,
  },
);

const { enabled: fetchEnabled, state: fetchState } = useFetchResource<DescriptionItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as DescriptionItem[] },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<DescriptionItem[]>(() => props.subscribe);

const sourceItems = computed<DescriptionItem[]>(() => {
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
  <div class="cumquat-descriptions" :class="bordered ? 'cumquat-descriptions--bordered' : ''">
    <h3 v-if="title" class="cumquat-descriptions__title">
      {{ title }}
    </h3>
    <p
      v-if="remoteLoading && sourceItems.length === 0"
      class="cumquat-descriptions__state cq-state--pending"
    >
      加载中…
    </p>
    <p
      v-else-if="remoteError && sourceItems.length === 0"
      class="cumquat-descriptions__state cq-state--error"
    >
      加载失败
      <CqButton size="sm" type="ghost" class="cumquat-descriptions__retry" @click="retryRemote">重试</CqButton>
    </p>
    <p v-else-if="sourceItems.length === 0" class="cumquat-descriptions__state">暂无数据</p>
    <dl
      v-else
      class="cumquat-descriptions__list"
      :style="
        bordered
          ? { gridTemplateColumns: `repeat(${column}, 1fr)` }
          : { gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }
      "
    >
      <div v-for="(item, index) in sourceItems" :key="index" class="cumquat-descriptions__item">
        <dt class="cumquat-descriptions__label">
          {{ item.label }}
        </dt>
        <dd class="cumquat-descriptions__value">
          {{ item.value }}
        </dd>
      </div>
    </dl>
  </div>
</template>
