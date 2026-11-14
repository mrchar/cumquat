<script setup lang="ts">
import type {
  FetchHandler,
  Kind,
  Option,
  Status,
  SubscribeHandler,
} from '@cumquat/core';
import {
  useClickOutside,
  useControllableModel,
  useFetchResource,
  useMediaQuery,
  usePagination,
  useSubscribeResource,
} from '@cumquat/composables';
import { computed, getCurrentInstance, ref, watch } from 'vue';
import type { VNodeChild } from 'vue';

import CqButton from '../general/Button.vue';
import Pagination from '../navigation/Pagination.vue';
import Dropdown from '../navigation/Dropdown.vue';
import Tooltip from './Tooltip.vue';
import TableFilterPanel from './TableFilterPanel.vue';
import { resolveCell } from './cells';
import type { CellColumn, CellRenderer } from './cells';

export interface TableColumn {
  key: string;
  /** 列标题；缺省时回落字段名 */
  title?: string;
  /** 帮助提示 */
  help?: string;
  /** 枚举映射：值 → 文案，值可为 string / number / boolean / null；同时作为默认筛选项 */
  enum?: Option[];
  /** 单元格格式化：返回展示内容；提供后优先于竞选 */
  formatter?: (value: unknown, row: Row, index: number) => VNodeChild;
  /** 筛选候选值：静态数组直接使用，FetchHandler 则在展开面板时拉取；缺省时回落到 enum */
  options?: Option[] | FetchHandler<Option>;
  width?: string;
  align?: 'left' | 'center' | 'right';
  /** 显式指定单元格渲染器名称（如 'tag'），指定即生效，跳过竞选 */
  cell?: string;
  /** 竞选加成：对指定渲染器加减分（正负均可），可翻转竞选结果 */
  bias?: Record<string, number>;
  /** 该列可排序 */
  sortable?: boolean;
  /** 本地排序比较器；远程排序时仅回发状态 */
  sorter?: (a: Row, b: Row) => number;
  /** 自定义本地筛选谓词 */
  filterMethod?: (value: FilterValue, row: Row) => boolean;
}

/** 列输入：公开属性之外，资源池投影可能携带 type / format，仅供组件内部竞选消费 */
type ColumnInput = TableColumn & { type?: Kind; format?: string };

/** 内部解析后的列：补全标题并生成默认筛选项 */
interface ResolvedTableColumn extends ColumnInput {
  title: string;
}

type Row = Record<string, unknown>;

/** 筛选值：与 Option.value 对齐，覆盖布尔与 null 枚举 */
type FilterValue = string | number | boolean | null;

/** 列 key → 已选筛选值 */
type FilterValues = Record<string, FilterValue[]>;

/** 远程数据状态：组件自有的 props 形状，不在 core 中定义 */
type State<T> = {
  status: Status;
  data?: T;
  error?: unknown;
  retry?: () => void;
};

/** 行操作：约定渲染在表格最后一列 / 卡片操作区，溢出项自动合并进「更多」下拉 */
export interface TableAction<Row = Record<string, unknown>> {
  key: string;
  label: string;
  /** 危险操作，以强调色文本展示 */
  danger?: boolean;
  disabled?: boolean | ((row: Row, index: number) => boolean);
  /** 按行隐藏该操作 */
  hidden?: (row: Row, index: number) => boolean;
  onClick?: (row: Row, index: number) => void;
}

/** 列解析：补全标题；enum 列未提供候选值时默认以 enum 作为筛选项 */
function resolveColumn(column: ColumnInput): ResolvedTableColumn {
  const resolved: ResolvedTableColumn = { ...column, title: column.title ?? column.key };
  if (resolved.options === undefined && resolved.enum && resolved.enum.length > 0) {
    resolved.options = resolved.enum;
  }
  return resolved;
}

const props = withDefaults(
  defineProps<{
    /** 列配置；schema 可通过 schemaToColumns 投影后传入 */
    columns?: TableColumn[];
    rows?: Row[];
    striped?: boolean;
    loading?: boolean;
    emptyText?: string;
    /** 远程数据状态：传入后 rows/loading 由其派生，组件自身不发请求 */
    data?: State<Row[]>;
    /**
     * 统一远程请求方法：只绑定方法，组件挂载即请求；
     * 翻页、排序、筛选变化自动以最新参数重取，返回数组或 { list, page, size, total }
     */
    fetch?: FetchHandler<Row>;
    /**
     * 订阅数据：挂载时调用，resolve 出的行数据用于渲染。
     * 优先级：subscribe > fetch > data > rows
     */
    subscribe?: SubscribeHandler<Row[]>;
    /** 远程数据总条数（本地数据默认取 rows 长度） */
    total?: number;
    rowKey?: (row: Row, index: number) => string | number;
    selectable?: boolean;
    expandable?: boolean;
    /** 是否内置分页条；绑定 v-model:page 时自动开启 */
    pagination?: boolean;
    /** 当前页（受控，v-model:page）；不传为组件内部状态 */
    page?: number;
    /** 每页条数；配合 @update:size 即 v-model:size 受控 */
    size?: number;
    sizes?: number[];
    /** 排序状态（受控，v-model:sorter）；不传为组件内部状态 */
    sorter?: { key: string; order: 'asc' | 'desc' | null };
    /** 筛选状态（受控，v-model:filters）；不传为组件内部状态 */
    filters?: FilterValues;
    /** 初始排序字段（非受控） */
    defaultSort?: { key: string; order: 'asc' | 'desc' };
    /** 局部单元格渲染器：与全局注册共同参与竞选，同名显式指定与同分时局部优先 */
    cells?: CellRenderer[];
    /** 小屏卡片模式：视口宽度小于 cardBreakpoint 时以卡片列表代替表格 */
    responsive?: boolean;
    /** 卡片模式触发的视口断点（max-width） */
    cardBreakpoint?: string;
    /** 行操作列表：约定渲染在最后一列（表格）/ 卡片操作区（卡片），溢出合并进「更多」 */
    actions?: TableAction<Row>[];
    /** 内联操作数上限，超出部分收进「更多」下拉 */
    visibleActions?: number;
  }>(),
  {
    rows: () => [],
    striped: false,
    loading: false,
    emptyText: '暂无数据',
    data: undefined,
    fetch: undefined,
    subscribe: undefined,
    total: undefined,
    rowKey: (_row: Row, index: number) => index,
    selectable: false,
    expandable: false,
    pagination: false,
    size: 10,
    sizes: () => [10, 20, 50],
    defaultSort: undefined,
    cells: undefined,
    responsive: false,
    cardBreakpoint: '768px',
    actions: () => [],
    visibleActions: 2,
  },
);

const hasActions = computed(() => props.actions.length > 0);

/** 实际列：逐列补全标题与默认筛选项 */
const tableColumns = computed<ResolvedTableColumn[]>(() =>
  (props.columns ?? []).map(resolveColumn),
);

const actionDisabled = (action: TableAction<Row>, row: Row, index: number) =>
  typeof action.disabled === 'function' ? action.disabled(row, index) : (action.disabled ?? false);

/** 按行解析操作视图：内联 + 溢出「更多」 */
const rowActionView = (row: Row, index: number) => {
  const list = props.actions.filter((action) => !action.hidden?.(row, index));
  const limit = Math.max(0, props.visibleActions);
  return {
    inline: list.slice(0, limit),
    more: list.slice(limit).map((action) => ({
      key: action.key,
      label: action.label,
      disabled: actionDisabled(action, row, index),
    })),
  };
};

const runAction = (action: TableAction<Row>, row: Row, index: number) => {
  if (actionDisabled(action, row, index)) return;
  action.onClick?.(row, index);
};

const colspan = computed(
  () =>
    tableColumns.value.length +
    (props.selectable ? 1 : 0) +
    (props.expandable ? 1 : 0) +
    (hasActions.value ? 1 : 0),
);

const emit = defineEmits<{
  'update:selectedKeys': [keys: Array<string | number>];
  'update:page': [page: number];
  'update:size': [size: number];
  'update:sorter': [sorter: { key: string; order: 'asc' | 'desc' | null }];
  'update:filters': [filters: FilterValues];
  /** 五类状态的统一变化事件（外层据此发请求） */
  change: [
    payload: {
      pagination: { page: number; size: number };
      sorter: { key: string; order: 'asc' | 'desc' | null };
      filters: FilterValues;
    },
  ];
  rowExpand: [payload: { row: Row; expanded: boolean; key: string | number }];
}>();

/* 远程四态与 fetch 资源钩子在分页初始化后统一建立（fetch 优先于 data） */

/* ---------------- 排序（受控/非受控统一） ---------------- */
interface SorterState {
  key: string;
  order: 'asc' | 'desc' | null;
}

const sorterModel = useControllableModel<SorterState>({
  modelValue: props.sorter !== undefined ? () => props.sorter as SorterState : undefined,
  defaultValue: {
    key: props.defaultSort?.key ?? '',
    order: props.defaultSort?.order ?? null,
  },
  onChange: (next) => emit('update:sorter', next),
});
const sorterState = sorterModel.value;

function toggleSort(column: TableColumn) {
  if (!column.sortable) return;
  const order =
    sorterState.value.key !== column.key
      ? 'asc'
      : sorterState.value.order === 'asc'
        ? 'desc'
        : null;
  sorterState.value = { key: order ? column.key : '', order };
  emitChange();
}

/* ---------------- 筛选（表头小面板） ---------------- */
const filterModel = useControllableModel<FilterValues>({
  modelValue: props.filters !== undefined ? () => props.filters as FilterValues : undefined,
  defaultValue: {},
  onChange: (next) => emit('update:filters', next),
});
const filterValues = filterModel.value;
const openFilterKey = ref<string | null>(null);

function toggleFilter(column: TableColumn, value: FilterValue) {
  const current = filterValues.value[column.key] ?? [];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  filterValues.value = { ...filterValues.value, [column.key]: next };
}

function clearFilter(column: TableColumn) {
  filterValues.value = { ...filterValues.value, [column.key]: [] };
}

/* ---------------- 本地过滤 + 排序 ---------------- */
const processedRows = computed<Row[]>(() => {
  let list = sourceRows.value;

  if (!isRemote.value) {
    for (const column of tableColumns.value) {
      const picked = filterValues.value[column.key];
      if (picked && picked.length > 0) {
        list = list.filter((row) =>
          picked.some((value) =>
            column.filterMethod
              ? column.filterMethod(value, row)
              : String(row[column.key]) === String(value),
          ),
        );
      }
    }
  }

  if (!isRemote.value && sorterState.value.key && sorterState.value.order) {
    const column = tableColumns.value.find((item) => item.key === sorterState.value.key);
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (column?.sorter) {
        const result = column.sorter(a, b);
        return sorterState.value.order === 'asc' ? result : -result;
      }
      const av = a[sorterState.value.key];
      const bv = b[sorterState.value.key];
      const result = av === bv ? 0 : (av as never) > (bv as never) ? 1 : -1;
      return sorterState.value.order === 'asc' ? result : -result;
    });
    list = sorted;
  }

  return list;
});

/* ---------------- 分页（受控/非受控统一） ---------------- */
// size 有默认值 10，无法以 undefined 判定受控；
// 以 vnode 上是否挂 @update:size 监听器作为 v-model 绑定信号，
// 兼容历史上 :size="20" 单向初始值用法（仍可内部切换）
const vnodeProps = getCurrentInstance()?.vnode.props ?? {};
const pageControlled = props.page !== undefined;
const sizeControlled = 'onUpdate:size' in vnodeProps;

const {
  page,
  size,
  go,
  setSize,
  total: pTotal,
} = usePagination({
  total: props.total ?? props.data?.data?.length ?? props.rows.length,
  page: pageControlled ? () => props.page as number : undefined,
  onPageChange: (value) => emit('update:page', value),
  size: sizeControlled ? () => props.size : undefined,
  // 初始每页条数走非受控槽位；受控槽位会把快照锁死导致切换失效
  defaultSize: props.size,
  onSizeChange: (value) => emit('update:size', value),
  sizes: props.sizes,
});

/** 绑定 v-model:page 即视为需要分页器 */
const showPager = computed(() => props.pagination || pageControlled);

/* ---------------- fetch 统一请求机制 ---------------- */
const {
  enabled: fetchEnabled,
  state: fetchState,
  total: fetchTotal,
  pageInfo,
} = useFetchResource<Row[]>(() => props.fetch, {
  getQuery: () => ({
    page: page.value,
    size: size.value,
    sorter:
      sorterState.value.key && sorterState.value.order
        ? { key: sorterState.value.key, order: sorterState.value.order }
        : undefined,
    filters: { ...filterValues.value },
  }),
  initialData: [] as Row[],
});

/* ---------------- 远程四态归一（subscribe 优先，其次 fetch，兼容 data） ---------------- */
const { state: subState } = useSubscribeResource<Row[]>(() => props.subscribe);

const remoteState = computed<State<Row[]> | undefined>(() => {
  if (props.subscribe) return subState.value;
  return fetchEnabled.value ? fetchState.value : props.data;
});
const remoteLoading = computed(() => props.loading || remoteState.value?.status === 'pending');
const remoteError = computed(() =>
  remoteState.value?.status === 'error' ? remoteState.value.error : undefined,
);
const remoteStale = computed(() => {
  const state = remoteState.value;
  return !!state && state.status !== 'success' && state.data !== undefined;
});
const sourceRows = computed<Row[]>(() =>
  remoteState.value ? (remoteState.value.data ?? []) : props.rows,
);
const isRemote = computed(() => !!remoteState.value);
const remoteTotal = computed(() =>
  fetchEnabled.value ? fetchTotal.value : (props.total ?? sourceRows.value.length),
);

watch(remoteTotal, (value) => {
  pTotal.value = value;
});

// 分页条展示响应中的分页值而非请求参数：后端可能回传真实页码或被裁剪的页大小
watch(pageInfo, (info) => {
  if (!info) return;
  if (info.page !== page.value) page.value = info.page;
  if (info.size !== size.value) size.value = info.size;
  pTotal.value = info.total;
});

const pageRows = computed<Row[]>(() => {
  if (!showPager.value) return processedRows.value;
  // 远程数据按约定已分页，直接展示
  if (isRemote.value) return processedRows.value;
  const start = (page.value - 1) * size.value;
  return processedRows.value.slice(start, start + size.value);
});

watch(page, () => emitChange());
watch(size, () => emitChange());

// 筛选变化回到第 1 页：远程查询与本地分页都避免落在越界页。
// 页码真正变化时由 watch(page) 统一发 change，避免同一次操作发两次。
watch(
  filterValues,
  () => {
    if (page.value !== 1) go(1);
    else emitChange();
  },
  { deep: true },
);

function emitChange() {
  emit('change', {
    pagination: { page: page.value, size: size.value },
    sorter: { ...sorterState.value },
    filters: { ...filterValues.value },
  });
}

/* 表头筛选面板：点击表格外部时关闭 */
const rootEl = ref<HTMLElement | null>(null);
useClickOutside(rootEl, () => {
  openFilterKey.value = null;
});

/* ---------------- 选择（跨页汇总） ---------------- */
const selectedKeys = ref<Array<string | number>>([]);
watch(selectedKeys, (keys) => emit('update:selectedKeys', keys), { deep: true });

const pageKeys = computed(() => pageRows.value.map((row, index) => props.rowKey(row, index)));
const pageAllChecked = computed(
  () =>
    pageKeys.value.length > 0 && pageKeys.value.every((key) => selectedKeys.value.includes(key)),
);
const pageIndeterminate = computed(
  () => !pageAllChecked.value && pageKeys.value.some((key) => selectedKeys.value.includes(key)),
);

function togglePageAll() {
  const set = new Set(selectedKeys.value);
  if (pageAllChecked.value) pageKeys.value.forEach((key) => set.delete(key));
  else pageKeys.value.forEach((key) => set.add(key));
  selectedKeys.value = Array.from(set);
}

function isRowChecked(row: Row, index: number) {
  return selectedKeys.value.includes(props.rowKey(row, index));
}

function toggleRow(row: Row, index: number) {
  const key = props.rowKey(row, index);
  const set = new Set(selectedKeys.value);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  selectedKeys.value = Array.from(set);
}

/* ---------------- 展开行 ---------------- */
const expandedKeys = ref<Array<string | number>>([]);

function isRowExpanded(row: Row, index: number) {
  return expandedKeys.value.includes(props.rowKey(row, index));
}

function toggleExpand(row: Row, index: number) {
  const key = props.rowKey(row, index);
  const expanded = !expandedKeys.value.includes(key);
  expandedKeys.value = expanded
    ? [...expandedKeys.value, key]
    : expandedKeys.value.filter((item) => item !== key);
  emit('rowExpand', { row, expanded, key });
}

function bodyClick() {
  openFilterKey.value = null;
}

/* ---------------- 单元格渲染（插槽 > formatter > 显式 cell / 竞选 > 文本） ---------------- */
interface ColumnPlan {
  cell?: CellRenderer;
  meta: CellColumn;
}

/** 列元数据 → 竞选输入：枚举映射拆为取值与文案，其余附加字段原样透传供宿主评分 */
function toCellColumn(column: ResolvedTableColumn): CellColumn {
  const { enum: enumOptions, options: _remoteOptions, ...rest } = column;
  return {
    ...rest,
    ...(enumOptions
      ? { enum: enumOptions.map((option) => option.value), options: enumOptions }
      : {}),
  };
}

const columnPlans = computed(() => {
  const plan = new Map<string, ColumnPlan>();
  for (const column of tableColumns.value) {
    const meta = toCellColumn(column);
    plan.set(column.key, { cell: resolveCell(meta, props.cells), meta });
  }
  return plan;
});

/* ---------------- 小屏卡片模式 ---------------- */
const isMobileViewport = useMediaQuery(() => `(max-width: ${props.cardBreakpoint})`);
const cardMode = computed(() => props.responsive === true && isMobileViewport.value);

/** 默认文本渲染：与竞选 Cell 输出同形，nullish 显示为空 */
const CellView = (cellProps: {
  plan?: ColumnPlan;
  row: Row;
  column: ResolvedTableColumn;
  index: number;
}) => {
  const { row, column, index } = cellProps;
  const value = row[column.key];
  if (column.formatter) return column.formatter(value, row, index);
  if (cellProps.plan?.cell) return cellProps.plan.cell.render(value, cellProps.plan.meta);
  return value === null || value === undefined ? '' : String(value);
};
</script>

<template>
  <div
    ref="rootEl"
    class="cumquat-table"
    :class="[remoteStale ? 'cumquat-table--stale' : '', cardMode ? 'cumquat-table--card' : '']"
    @click="bodyClick"
  >
    <table v-if="!cardMode" class="cumquat-table__table">
      <thead>
        <tr class="cumquat-table__head-row">
          <th
            v-if="selectable"
            class="cumquat-table__th cumquat-table__th--center cumquat-table__selection"
          >
            <input
              type="checkbox"
              class="cumquat-table__checkbox"
              :checked="pageAllChecked"
              :indeterminate="pageIndeterminate"
              @change="togglePageAll"
              @click.stop
            />
          </th>
          <th
            v-for="col in tableColumns"
            :key="col.key"
            class="cumquat-table__th"
            :class="`cumquat-table__th--${col.align ?? 'left'}`"
            :style="col.width ? { width: col.width } : undefined"
          >
            <span class="cumquat-table__th-title">
              <span class="cumquat-table__th-text" :title="col.title">{{ col.title }}</span>
              <Tooltip
                v-if="col.help"
                class="cumquat-table__th-help"
                :content="col.help"
                placement="top"
              >
                <span class="cumquat-table__th-help-icon" aria-label="字段说明">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5M12 7.6v.8" stroke-linecap="round" />
                  </svg>
                </span>
              </Tooltip>
              <button
                v-if="col.sortable"
                type="button"
                aria-label="排序"
                class="cumquat-table__sorter"
                :class="[
                  sorterState.key === col.key ? `cumquat-table__sorter--${sorterState.order}` : '',
                ]"
                @click.stop="toggleSort(col)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
                </svg>
              </button>
              <span v-if="col.options" class="cumquat-table__filter">
                <button
                  type="button"
                  aria-label="筛选"
                  class="cumquat-table__filter-trigger"
                  :class="
                    (filterValues[col.key]?.length ?? 0) > 0
                      ? 'cumquat-table__filter-trigger--active'
                      : ''
                  "
                  @click.stop="openFilterKey = openFilterKey === col.key ? null : col.key"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" />
                  </svg>
                </button>
                <TableFilterPanel
                  v-if="openFilterKey === col.key"
                  :options="col.options"
                  :selected="filterValues[col.key] ?? []"
                  @toggle="(value) => toggleFilter(col, value)"
                  @clear="clearFilter(col)"
                />
              </span>
            </span>
          </th>
          <th v-if="hasActions" class="cumquat-table__th cumquat-table__th--right">
            <span class="cumquat-table__th-title">
              <span class="cumquat-table__th-text" title="操作">操作</span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(row, index) in pageRows" :key="props.rowKey(row, index)">
          <tr
            class="cumquat-table__row"
            :class="[
              striped && index % 2 === 1 ? 'cumquat-table__row--striped' : '',
              isRowChecked(row, index) ? 'cumquat-table__row--selected' : '',
            ]"
          >
            <td v-if="selectable" class="cumquat-table__td cumquat-table__td--center">
              <input
                type="checkbox"
                class="cumquat-table__checkbox"
                :checked="isRowChecked(row, index)"
                @change="toggleRow(row, index)"
              />
            </td>
            <td
              v-for="col in tableColumns"
              :key="col.key"
              class="cumquat-table__td"
              :class="`cumquat-table__td--${col.align ?? 'left'}`"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                <CellView
                  :plan="columnPlans.get(col.key)"
                  :row="row"
                  :column="col"
                  :index="index"
                />
              </slot>
            </td>
            <td v-if="expandable" class="cumquat-table__td cumquat-table__expand-cell">
              <button
                type="button"
                aria-label="展开行"
                class="cumquat-table__expander"
                :class="isRowExpanded(row, index) ? 'cumquat-table__expander--open' : ''"
                @click="toggleExpand(row, index)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </td>
            <td v-if="hasActions" class="cumquat-table__td cumquat-table__td--actions">
              <div class="cumquat-table__actions">
                <CqButton
                  v-for="action in rowActionView(row, index).inline"
                  :key="action.key"
                  type="ghost"
                  size="sm"
                  :class="action.danger ? 'cumquat-table__action--danger' : ''"
                  :disabled="actionDisabled(action, row, index)"
                  @click="runAction(action, row, index)"
                >
                  {{ action.label }}
                </CqButton>
                <Dropdown
                  v-if="rowActionView(row, index).more.length"
                  placement="bottom-end"
                  :items="rowActionView(row, index).more"
                  @select="
                    (item) => {
                      const action = props.actions.find((a) => a.key === item.key);
                      if (action) runAction(action, row, index);
                    }
                  "
                >
                  <template #trigger>
                    <CqButton type="ghost" size="sm">更多</CqButton>
                  </template>
                </Dropdown>
              </div>
            </td>
          </tr>
          <tr v-if="expandable && isRowExpanded(row, index)" class="cumquat-table__expanded-row">
            <td :colspan="colspan">
              <slot name="expanded" :row="row" :index="index" />
            </td>
          </tr>
        </template>

        <tr v-if="pageRows.length === 0">
          <td :colspan="colspan" class="cumquat-table__empty">
            <span v-if="remoteLoading" class="cumquat-table__loading cq-state--pending" />
            <CqButton
              v-else-if="remoteError"
              size="sm"
              type="ghost"
              class="cq-state--error cumquat-table__retry"
              @click.stop="remoteState?.retry?.()"
            >
              加载失败，点击重试
            </CqButton>
            <template v-else>{{ emptyText }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 小屏卡片模式：每行渲染为一张卡片，字段 = 列名 + 单元格值（复用 cell 插槽与竞选） -->
    <div v-else class="cumquat-table__cards" role="list">
      <template v-for="(row, index) in pageRows" :key="props.rowKey(row, index)">
        <div
          class="cumquat-table-card"
          :class="isRowChecked(row, index) ? 'cumquat-table-card--selected' : ''"
          role="listitem"
        >
          <div v-if="selectable" class="cumquat-table-card__bar">
            <input
              v-if="selectable"
              type="checkbox"
              class="cumquat-table__checkbox"
              :checked="isRowChecked(row, index)"
              @change="toggleRow(row, index)"
            />
          </div>
          <slot name="card" :row="row" :index="index">
            <div class="cumquat-table-card__fields">
              <div v-for="col in tableColumns" :key="col.key" class="cumquat-table-card__field">
                <span class="cumquat-table-card__label" :title="col.title">{{ col.title }}</span>
                <span class="cumquat-table-card__value">
                  <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                    <CellView
                      :plan="columnPlans.get(col.key)"
                      :row="row"
                      :column="col"
                      :index="index"
                    />
                  </slot>
                </span>
              </div>
            </div>
          </slot>
          <div v-if="hasActions" class="cumquat-table-card__footer">
            <CqButton
              v-for="action in rowActionView(row, index).inline"
              :key="action.key"
              type="ghost"
              size="sm"
              :class="action.danger ? 'cumquat-table__action--danger' : ''"
              :disabled="actionDisabled(action, row, index)"
              @click="runAction(action, row, index)"
            >
              {{ action.label }}
            </CqButton>
            <Dropdown
              v-if="rowActionView(row, index).more.length"
              placement="bottom-end"
              :items="rowActionView(row, index).more"
              @select="
                (item) => {
                  const action = props.actions.find((a) => a.key === item.key);
                  if (action) runAction(action, row, index);
                }
              "
            >
              <template #trigger>
                <CqButton type="ghost" size="sm">更多</CqButton>
              </template>
            </Dropdown>
          </div>
        </div>
      </template>

      <div v-if="pageRows.length === 0" class="cumquat-table__empty">
        <span v-if="remoteLoading" class="cumquat-table__loading cq-state--pending" />
        <CqButton
          v-else-if="remoteError"
          size="sm"
          type="ghost"
          class="cq-state--error cumquat-table__retry"
          @click.stop="remoteState?.retry?.()"
        >
          加载失败，点击重试
        </CqButton>
        <template v-else>{{ emptyText }}</template>
      </div>
    </div>

    <div v-if="remoteError && pageRows.length > 0" class="cumquat-table__errorbar cq-state--error">
      加载失败
      <CqButton
        size="sm"
        type="ghost"
        class="cumquat-table__retry"
        @click.stop="remoteState?.retry?.()"
      >
        点击重试
      </CqButton>
    </div>

    <div v-if="showPager" class="cumquat-table__footer">
      <Pagination
        :page="page"
        :size="size"
        :total="pTotal"
        :sizes="sizes"
        show-size-changer
        @update:page="go"
        @update:size="setSize"
      />
    </div>
  </div>
</template>