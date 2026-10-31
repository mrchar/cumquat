<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFetchResource, useSubscribe } from '@cumquat/composables';
import type { AsyncStateLike, Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';
import ListItem from './ListItem.vue';
import ListItemMeta from './ListItemMeta.vue';

/** 列表项映射器：把一个列表项映射为展示文本（非静态值，避免字段魔法推断） */
export type ListMapper = (item: any) => string;

const props = withDefaults(
  defineProps<{
    /** 本地数据：对象或原始值均可 */
    items?: unknown[];
    /** 远程数据状态：传入后 items 由其派生，组件自身不发请求 */
    data?: AsyncStateLike<unknown[]>;
    /**
     * 统一远程请求方法：挂载即请求；返回数组作为普通列表，
     * 返回 { list, total } 自动识别为分页结果并启用加载更多
     */
    fetch?: Fetch<unknown>;
    /**
     * 订阅数据：挂载时调用，resolve 出的列表数据用于渲染。
     * 优先级：subscribe > fetch > data > items
     */
    subscribe?: SubscribeHandler<unknown[]>;
    /** 头部文本；#header 插槽优先 */
    header?: string;
    /** 底部文本；#footer 插槽优先 */
    footer?: string;
    /** 空态文案 */
    emptyText?: string;
    /** 标题映射器：#item 插槽缺失时驱动内建 Meta 的标题 */
    title?: ListMapper;
    /** 描述映射器：#item 插槽缺失时驱动内建 Meta 的描述 */
    description?: ListMapper;
    /** 头像地址映射器：#item 插槽缺失时驱动内建 Meta 的头像 */
    avatar?: ListMapper;
    /** 列表项唯一键；用于 v-for 与跨页渲染稳定性 */
    rowKey?: (item: any, index: number) => string | number;
    /** 默认展开全部含 children 的列表项（缺省收起，点展开箭头逐个展开） */
    defaultExpandAll?: boolean;
    /** 列表最大高度：设置后根容器内部滚动，触底自动加载下一页 */
    height?: string;
    /** 每页条数（fetch 返回 { list, total } 分页结果时生效） */
    pageSize?: number;
  }>(),
  {
    items: () => [],
    data: undefined,
    fetch: undefined,
    subscribe: undefined,
    header: '',
    footer: '',
    emptyText: '暂无数据',
    title: undefined,
    description: undefined,
    avatar: undefined,
    rowKey: undefined,
    defaultExpandAll: false,
    height: '',
    pageSize: 20,
  },
);

/* ---------------- fetch：挂载即拉列表；分页结果触底累积 ---------------- */
const { enabled: fetchEnabled, state: fetchState, total: fetchTotal, refresh: refreshFetch } =
  useFetchResource<unknown[]>(() => props.fetch, {
    getQuery: () => ({ pagination: { currentPage: 1, pageSize: props.pageSize } }),
    initialData: [] as unknown[],
    // 查询基线恒为第 1 页（第 1 页整体替换），翻页靠命令式 refresh 累积
    merge: (previous, next, query) =>
      (query.pagination?.currentPage ?? 1) <= 1 ? next : [...previous, ...next],
  });

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<unknown[]>(() => props.subscribe);

const remoteState = computed<AsyncStateLike<unknown[]> | undefined>(() => {
  if (props.subscribe) return subState.value as AsyncStateLike<unknown[]>;
  return fetchEnabled.value ? fetchState.value : props.data;
});
const remoteLoading = computed(() => remoteState.value?.status === 'pending');
const remoteError = computed(() =>
  remoteState.value?.status === 'error' ? remoteState.value.error : undefined,
);
const remoteStale = computed(() => !!remoteState.value?.isStale);
const rows = computed<unknown[]>(() =>
  remoteState.value ? (remoteState.value.data ?? []) : props.items,
);

function retryRemote() {
  if (props.subscribe && subState.value.status === 'error') subState.value.retry?.();
  else fetchState.value?.retry?.();
}

/** 是否还有下一页：已累积条数尚未达到 total。纯数组返回恒为 false */
const hasMore = computed(
  () => fetchEnabled.value && !props.subscribe && fetchTotal.value > rows.value.length,
);

/** 触底加载下一页：命令式 refresh 绕过查询监听，保证翻页即时；页码由累积条数推算 */
function loadMore() {
  if (!hasMore.value || remoteLoading.value) return;
  const next = Math.ceil(rows.value.length / props.pageSize) + 1;
  void refreshFetch({ pagination: { currentPage: next, pageSize: props.pageSize } });
}

/** 根容器滚动：设置了 height 时容器内部滚动，接近底部一行即触发下一页 */
function onScroll(event: Event) {
  if (!props.height) return;
  const el = event.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 32) loadMore();
}

/* ---------------- 行渲染降级链：#item 插槽 > 内建 Meta（映射器驱动）> String 兜底 ---------------- */
const hasMappers = computed(() => !!(props.title || props.description || props.avatar));
const titleOf = (item: any) => props.title?.(item);
const descriptionOf = (item: any) => props.description?.(item);
const avatarOf = (item: any) => props.avatar?.(item);
const plainText = (item: unknown) => (item === null || item === undefined ? '' : String(item));

/* ---------------- children 树形数据：扁平化渲染，缩进表达层级，箭头折叠 ---------------- */
const emit = defineEmits<{
  /** 列表项折叠状态变化 */
  expand: [payload: { item: any; expanded: boolean }];
}>();

interface FlatRow {
  item: any;
  /** 兄弟序列内的序号 */
  index: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  key: string | number;
}

const childrenOf = (item: any): any[] => (Array.isArray(item?.children) ? item.children : []);

/** 节点键：rowKey 直接产出；缺省按「父路径-序号」合成，保证跨层唯一 */
const keyAt = (item: any, index: number, parentPath: string): string | number =>
  props.rowKey ? props.rowKey(item, index) : parentPath ? `${parentPath}-${index}` : index;

/** 用户手动切换过的节点集合：defaultExpandAll 下语义为「被收起」，否则为「被展开」 */
const toggledKeys = ref(new Set<string>());

function toggleRow(row: FlatRow) {
  if (!row.hasChildren) return;
  const key = String(row.key);
  const next = new Set(toggledKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  toggledKeys.value = next;
  emit('expand', {
    item: row.item,
    expanded: props.defaultExpandAll ? !next.has(key) : next.has(key),
  });
}

const visibleRows = computed<FlatRow[]>(() => {
  const out: FlatRow[] = [];
  const walk = (list: unknown[], depth: number, parentPath: string) => {
    list.forEach((item, index) => {
      const key = keyAt(item, index, parentPath);
      const children = childrenOf(item);
      const hasChildren = children.length > 0;
      const expanded =
        hasChildren &&
        (props.defaultExpandAll
          ? !toggledKeys.value.has(String(key))
          : toggledKeys.value.has(String(key)));
      out.push({ item, index, depth, hasChildren, expanded, key });
      if (expanded) walk(children, depth + 1, String(key));
    });
  };
  walk(rows.value, 0, '');
  return out;
});

/** 缩进几何：基准内边距 1rem 之上按层级叠加 */
const depthStyle = (depth: number) => ({ paddingInlineStart: `calc(1rem + ${depth * 1.25}rem)` });
</script>

<template>
  <div
    class="cumquat-list"
    :class="[remoteStale ? 'cumquat-list--stale' : '', height ? 'cumquat-list--scroll' : '']"
    :style="height ? { maxHeight: height } : undefined"
    @scroll="onScroll"
  >
    <div v-if="$slots.header || header" class="cumquat-list__header">
      <slot name="header">{{ header }}</slot>
    </div>

    <p v-if="remoteLoading && rows.length === 0" class="cumquat-list__state cq-state--pending">
      加载中…
    </p>
    <p v-else-if="remoteError && rows.length === 0" class="cumquat-list__state cq-state--error">
      加载失败
      <CqButton size="sm" type="ghost" class="cumquat-list__retry" @click="retryRemote">
        重试
      </CqButton>
    </p>

    <ul v-else-if="rows.length > 0" class="cumquat-list__body">
      <template v-for="row in visibleRows" :key="row.key">
        <slot
          name="item"
          :item="row.item"
          :index="row.index"
          :depth="row.depth"
          :has-children="row.hasChildren"
          :expanded="row.expanded"
          :toggle="() => toggleRow(row)"
        >
          <ListItem
            :style="depthStyle(row.depth)"
            :class="hasMappers ? '' : 'cumquat-list-item--plain'"
          >
            <div class="cumquat-list-item__row">
              <button
                v-if="row.hasChildren"
                type="button"
                class="cumquat-list__expander"
                :class="row.expanded ? 'cumquat-list__expander--expanded' : ''"
                :aria-label="row.expanded ? '收起' : '展开'"
                @click="toggleRow(row)"
              >
                <svg
                  class="cumquat-list__expander-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <ListItemMeta
                v-if="hasMappers"
                :avatar="avatarOf(row.item)"
                :title="titleOf(row.item)"
                :description="descriptionOf(row.item)"
              />
              <span v-else>{{ plainText(row.item) }}</span>
            </div>
          </ListItem>
        </slot>
      </template>
    </ul>

    <ul v-else-if="$slots.default" class="cumquat-list__body">
      <slot />
    </ul>

    <p v-else class="cumquat-list__state">{{ emptyText }}</p>

    <div v-if="remoteError && rows.length > 0" class="cumquat-list__errorbar cq-state--error">
      加载失败
      <CqButton size="sm" type="ghost" class="cumquat-list__retry" @click="retryRemote">
        点击重试
      </CqButton>
    </div>

    <div v-if="hasMore" class="cumquat-list__more">
      <CqButton
        size="sm"
        type="ghost"
        class="cumquat-list__more-btn"
        :disabled="remoteLoading"
        @click="loadMore"
      >
        {{ remoteLoading ? '加载中…' : '加载更多' }}
      </CqButton>
    </div>

    <div v-if="$slots.footer || footer" class="cumquat-list__footer">
      <slot name="footer">{{ footer }}</slot>
    </div>
  </div>
</template>
