<script setup lang="ts">
import { computed } from 'vue';
import { useFetchResource } from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

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
  }>(),
  { title: '', items: () => [], bordered: false, column: 2, fetch: undefined },
);

const { enabled: fetchEnabled, state: fetchState } = useFetchResource<DescriptionItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as DescriptionItem[] },
);

const sourceItems = computed<DescriptionItem[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items,
);
const remoteLoading = computed(() => fetchState.value?.status === 'pending');
const remoteError = computed(() =>
  fetchState.value?.status === 'error' ? fetchState.value.error : undefined,
);
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
      <button type="button" class="cumquat-descriptions__retry" @click="fetchState?.retry?.()">
        重试
      </button>
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
