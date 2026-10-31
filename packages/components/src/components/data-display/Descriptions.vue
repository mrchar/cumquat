<script setup lang="ts">
import { computed, h } from 'vue';
import { useFetchResource, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';
import { resolveCell } from './cells';
import type { CellColumn, CellRenderer } from './cells';

/**
 * 字段元数据：声明展示哪些字段、顺序与标签，与 useResources 的 properties 结构对齐，
 * format 原样透传 Swagger 声明。
 */
export interface DescriptionProperty {
  key: string;
  label: string;
  /** 保存格式提示：string / number / boolean / date / datetime / enum */
  type?: CellColumn['type'];
  /** 内容格式提示：email / uri / tag / status…（原样透传文档声明） */
  format?: string;
  /** 枚举选项：enum 形态据此显示 label */
  options?: Array<{ label: string; value: string | number }>;
  /** 显式指定单元格渲染器名称，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分 */
  bias?: Record<string, number>;
}

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 绑定的数据对象：按 properties 声明的字段取值展示 */
    data?: Record<string, unknown>;
    /** 字段元数据：渲染顺序与标签由此声明 */
    properties?: DescriptionProperty[];
    /** 局部单元格渲染器：优先于全局注册表参与竞选 */
    cells?: CellRenderer[];
    /** 单元格是否带边框 */
    bordered?: boolean;
    /** 每行列数 */
    column?: number;
    /**
     * 统一远程请求：挂载即拉取数据对象，返回 Record
     */
    fetch?: Fetch<Record<string, unknown>>;
    /**
     * 订阅数据：挂载时调用，resolve 出的数据对象用于渲染。
     * 优先级：subscribe > fetch > data
     */
    subscribe?: SubscribeHandler<Record<string, unknown>>;
  }>(),
  {
    title: '',
    data: undefined,
    properties: () => [],
    cells: undefined,
    bordered: false,
    column: 2,
    fetch: undefined,
    subscribe: undefined,
  },
);

const { enabled: fetchEnabled, state: fetchState } = useFetchResource<Record<string, unknown>>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: {} },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<Record<string, unknown>>(() => props.subscribe);

const sourceData = computed<Record<string, unknown> | undefined>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data ?? {};
  if (fetchEnabled.value) return fetchState.value?.data ?? {};
  return props.data;
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
const hasData = computed(() => {
  const data = sourceData.value;
  return !!data && Object.keys(data).length > 0;
});

function retryRemote() {
  if (props.subscribe && subState.value.status === 'error') subState.value.retry?.();
  else fetchState.value?.retry?.();
}

/** 字段元数据 → 竞选列定义 */
function toCellColumn(property: DescriptionProperty): CellColumn {
  return {
    key: property.key,
    title: property.label,
    type: property.type,
    format: property.format,
    options: property.options,
    cell: property.cell,
    bias: property.bias,
  };
}

/** 值渲染：属性插槽 > 显式 cell > 竞选推断 > 默认文本 */
function renderValue(property: DescriptionProperty): ReturnType<typeof h> {
  const cell = resolveCell(toCellColumn(property), props.cells);
  const value = sourceData.value?.[property.key];
  const rendered = cell
    ? cell.render(value, toCellColumn(property))
    : value === null || value === undefined
      ? ''
      : String(value);
  return h(() => rendered);
}
</script>

<template>
  <div class="cumquat-descriptions" :class="bordered ? 'cumquat-descriptions--bordered' : ''">
    <h3 v-if="title" class="cumquat-descriptions__title">
      {{ title }}
    </h3>
    <p
      v-if="remoteLoading && !hasData"
      class="cumquat-descriptions__state cq-state--pending"
    >
      加载中…
    </p>
    <p
      v-else-if="remoteError && !hasData"
      class="cumquat-descriptions__state cq-state--error"
    >
      加载失败
      <CqButton size="sm" type="ghost" class="cumquat-descriptions__retry" @click="retryRemote">重试</CqButton>
    </p>
    <p v-else-if="properties.length === 0" class="cumquat-descriptions__state">暂无数据</p>
    <dl
      v-else
      class="cumquat-descriptions__list"
      :style="
        bordered
          ? { gridTemplateColumns: `repeat(${column}, 1fr)` }
          : { gridTemplateColumns: `repeat(${column}, minmax(0, 1fr))` }
      "
    >
      <div v-for="property in properties" :key="property.key" class="cumquat-descriptions__item">
        <dt class="cumquat-descriptions__label">
          <slot :name="`label-${property.key}`" :value="sourceData?.[property.key]">
            {{ property.label }}
          </slot>
        </dt>
        <dd class="cumquat-descriptions__value">
          <slot :name="`value-${property.key}`" :value="sourceData?.[property.key]">
            <component :is="renderValue(property)" />
          </slot>
        </dd>
      </div>
    </dl>
  </div>
</template>
