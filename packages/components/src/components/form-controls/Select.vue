<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  useActionValue,
  useDismiss,
  useFetchResource,
  useFloating,
  useFormField,
  useListboxNavigation,
  useOpen,
  useSelectModel,
  useSubscribe,
} from '@cumquat/composables';
import type { ActionLike, AsyncStateLike, Fetch, SubscribeHandler } from '@cumquat/composables';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  /** 分组标题：相同 group 的选项在面板内聚合 */
  group?: string;
}

type V = string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: V | V[] | null;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    multiple?: boolean;
    filterable?: boolean;
    clearable?: boolean;
    name?: string;
    /** 远程数据状态：传入后优先于 options 渲染，组件自身不发请求 */
    state?: AsyncStateLike<SelectOption[]>;
    /**
     * 统一远程请求方法：挂载即请求首页，搜索词变化自动防抖重取，
     * 滚动到面板底部时以递增页码继续取下一页并累积（按 value 去重）。
     * 返回选项数组或 { list, total }
     */
    fetch?: Fetch<SelectOption>;
    /** 每页大小：fetch 模式下作为分页参数注入，默认 20 */
    pageSize?: number;
    /**
     * 订阅数据：挂载时调用，resolve 出的选项用于渲染。
     * 优先级：subscribe > fetch > state > options
     */
    subscribe?: SubscribeHandler<SelectOption[]>;
    /** 选择动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用选择 */
    action?: ActionLike;
  }>(),
  {
    options: () => [],
    placeholder: '请选择',
    disabled: false,
    multiple: false,
    filterable: false,
    clearable: false,
    name: undefined,
    state: undefined,
    fetch: undefined,
    pageSize: 20,
    subscribe: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: V | V[] | null];
  change: [value: V | V[] | null];
  /** 选择动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- fetch 统一请求机制（keyword 防抖 300ms） ---------------- */
/** 面板选项行高（px）：与主题的选项内边距/字号对应，虚拟滚动按此窗口化 */
const OPTION_HEIGHT = 36;
/** 超过该条数才启用虚拟滚动：低于阈值保留分组标题等静态结构 */
const VIRTUAL_THRESHOLD = 100;
/** 窗口上下各多渲染的行数，减少快速滚动时的空白 */
const VIRTUAL_OVERSCAN = 4;
// 用独立 keyword ref 避免在 getQuery 中引用下方才初始化的 select（TDZ）
const fetchKeyword = ref('');
/** 已加载到的页码：仅用于推算下一页；查询基线恒为第 1 页，翻页靠命令式 refresh 覆盖 */
const loadedPage = ref(1);
/** 面板滚动位置与可视高度：虚拟滚动的窗口输入 */
const scrollTop = ref(0);
const viewportHeight = ref(0);

/** 翻页累积：按 value 去重，避免后端数据在两次请求间漂移导致重复项 */
function appendByValue(previous: SelectOption[], next: SelectOption[]) {
  const seen = new Set(previous.map((option) => option.value));
  return [...previous, ...next.filter((option) => !seen.has(option.value))];
}

const {
  enabled: fetchEnabled,
  state: fetchState,
  total: fetchTotal,
  refresh: refreshFetch,
} = useFetchResource<SelectOption[]>(() => props.fetch, {
  getQuery: () => ({
    keyword: fetchKeyword.value,
    pagination: { currentPage: 1, pageSize: props.pageSize },
  }),
  initialData: [] as SelectOption[],
  debounce: 300,
  // 回到第 1 页（挂载 / 搜索变化）整体替换；翻页去重后累积
  merge: (previous, next, query) =>
    (query.pagination?.currentPage ?? 1) <= 1 ? next : appendByValue(previous, next),
});

/** 远程四态归一：subscribe 优先，其次 fetch，再次外部 state，最后本地 options */
const { state: subState } = useSubscribe<SelectOption[]>(() => props.subscribe);

const activeState = computed<AsyncStateLike<SelectOption[]> | undefined>(() => {
  if (props.subscribe) return subState.value as AsyncStateLike<SelectOption[]>;
  return fetchEnabled.value ? fetchState.value : props.state;
});
const remoteLoading = computed(() => activeState.value?.status === 'pending');
const remoteError = computed(() =>
  activeState.value?.status === 'error' ? activeState.value.error : undefined,
);
const allOptions = computed<SelectOption[]>(() => activeState.value?.data ?? props.options);

/** 是否还有下一页：已累积条数尚未达到 total。返回纯数组时 total 即长度，恒为 false */
const hasMore = computed(
  () => fetchEnabled.value && !props.subscribe && fetchTotal.value > allOptions.value.length,
);

/* ---------------- action 选择动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

/**
 * 唯一写入入口：值先经 field 落定（其 onChange 负责对外 emit），
 * 配置 action 时异步确认，失败回退旧值并抛出 actionError。
 * 注意此函数不得再调用 emit('update:modelValue')，否则与 field 的 onChange 重复回发。
 */
function applyChange(next: V | V[] | null) {
  const previous = field.value;
  field.handleChange(next);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(next),
    revert: () => field.handleChange(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

const field = useFormField<V | V[] | null>({
  name: props.name,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  // 只负责对外回发，写入编排统一交给 applyChange，
  // 避免 controllable setter 与 handleChange 互相回调造成无限递归
  onChange: (next) => emit('update:modelValue', next),
  disabled: () => props.disabled || actionPending.value,
});

const select = useSelectModel<V, string>({
  options: allOptions,
  multiple: props.multiple,
  // fetch 模式下同样启用关键词输入，但过滤在服务端，本地谓词直通；
  // subscribe 模式为静态列表，走本地过滤
  filterable: props.filterable || !!props.fetch || !!props.subscribe,
  filterMethod: props.fetch && !props.subscribe ? () => true : undefined,
  modelValue: field.value,
  // select 的每一次写入都回灌 applyChange（经 field 落值 + action 编排）
  onChange: (next) => applyChange(next as V | V[] | null),
});

// 将搜索关键词同步给 fetch 查询
watch(
  () => select.keyword.value,
  (value) => {
    fetchKeyword.value = value;
  },
);

watch(select.model, (value) => emit('change', value));

const { isOpen, open, close, toggle } = useOpen();

watch(isOpen, (next) => {
  if (next) {
    nav.reset();
    void nextTick().then(() => {
      dropdownWidth.value = referenceRef.value?.getBoundingClientRect().width ?? 0;
      viewportHeight.value = floatingRef.value?.clientHeight ?? 0;
      scrollTop.value = 0;
      update();
    });
  } else {
    select.setKeyword('');
    resetPaging();
  }
});

/** 关面板回到第 1 页：丢弃已累积的翻页数据，使下次展开只呈现首页 */
function resetPaging() {
  if (loadedPage.value === 1) return;
  loadedPage.value = 1;
  void refreshFetch({ pagination: { currentPage: 1, pageSize: props.pageSize } });
}

/** 触底加载下一页：命令式 refresh 绕过 keyword 防抖，保证翻页即时且不跳页 */
function loadMore() {
  if (!hasMore.value || remoteLoading.value) return;
  const next = loadedPage.value + 1;
  loadedPage.value = next;
  void refreshFetch({ pagination: { currentPage: next, pageSize: props.pageSize } });
}

/** 面板滚动：记录滚动位置，接近底部一行时触发下一页 */
function onDropdownScroll(event: Event) {
  const el = event.target as HTMLElement;
  scrollTop.value = el.scrollTop;
  viewportHeight.value = el.clientHeight;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - OPTION_HEIGHT) loadMore();
}

const { referenceRef, floatingRef, floatingStyles, update } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

const dropdownWidth = ref(0);
const dropdownStyle = computed(() => ({
  ...floatingStyles.value,
  width: dropdownWidth.value ? `${dropdownWidth.value}px` : undefined,
}));

useDismiss({
  isOpen,
  reference: referenceRef,
  floating: floatingRef,
  onDismiss: close,
});

const nav = useListboxNavigation({
  count: computed(() => select.filteredOptions.value.length),
  isItemDisabled: (index) => !!select.filteredOptions.value[index]?.disabled,
  onSelect: (index) => {
    const option = select.filteredOptions.value[index];
    if (option) pick(option);
  },
});

/** 分组组织：保序输出 { title, options }[] */
const groupedOptions = computed(() => {
  const groups: Array<{ title?: string; options: SelectOption[] }> = [];
  const indexMap = new Map<string, number>();
  for (const option of select.filteredOptions.value) {
    const title = option.group;
    if (!title) {
      groups.push({ options: [option] });
      continue;
    }
    const existing = indexMap.get(title);
    if (existing === undefined) {
      indexMap.set(title, groups.length);
      groups.push({ title, options: [option] });
    } else {
      groups[existing].options.push(option);
    }
  }
  return groups;
});

/* ---------------- 阈值虚拟滚动：条目过多时仅渲染可视窗口 ---------------- */

/** 条目数达到阈值才窗口化：低于阈值保留分组标题，避免破坏可读结构 */
const virtualEnabled = computed(() => select.filteredOptions.value.length >= VIRTUAL_THRESHOLD);

const virtualStart = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / OPTION_HEIGHT) - VIRTUAL_OVERSCAN),
);
const virtualEnd = computed(() => {
  const total = select.filteredOptions.value.length;
  // 未测到可视高度时按 8 行估算，保证 jsdom / 首帧也能渲染出窗口
  const visible = Math.ceil((viewportHeight.value || OPTION_HEIGHT * 8) / OPTION_HEIGHT);
  return Math.min(total, virtualStart.value + visible + VIRTUAL_OVERSCAN * 2);
});
/** 窗口上方占位高度：撑出滚动条，使滚动距离与真实列表一致 */
const padTop = computed(() => (virtualEnabled.value ? virtualStart.value * OPTION_HEIGHT : 0));
/** 窗口下方占位高度 */
const padBottom = computed(() =>
  virtualEnabled.value
    ? Math.max(0, (select.filteredOptions.value.length - virtualEnd.value) * OPTION_HEIGHT)
    : 0,
);

interface DisplayOptionRow {
  type: 'option';
  key: string;
  option: SelectOption;
  /** 在 filteredOptions 中的真实下标：供键盘导航与选中态比对 */
  index: number;
}
interface DisplayGroupRow {
  type: 'group';
  key: string;
  title: string;
}
type DisplayRow = DisplayOptionRow | DisplayGroupRow;

/** 渲染行：虚拟模式为窗口切片，非虚拟模式为分组结构，统一走同一循环 */
const displayRows = computed<DisplayRow[]>(() => {
  const options = select.filteredOptions.value;
  if (virtualEnabled.value) {
    const start = virtualStart.value;
    return options.slice(start, virtualEnd.value).map((option, offset) => ({
      type: 'option' as const,
      key: `opt-${start + offset}`,
      option,
      index: start + offset,
    }));
  }
  const indexOf = new Map(options.map((option, index) => [option, index]));
  return groupedOptions.value.flatMap((group, groupIndex) => {
    const rows: DisplayRow[] = [];
    if (group.title) {
      rows.push({ type: 'group', key: `group-${groupIndex}`, title: group.title });
    }
    for (const option of group.options) {
      rows.push({
        type: 'option',
        key: `opt-${indexOf.get(option) ?? groupIndex}`,
        option,
        index: indexOf.get(option) ?? 0,
      });
    }
    return rows;
  });
});

// 键盘导航到窗口外的条目时，同步滚动容器，使高亮行始终可见
watch(nav.activeIndex, (index) => {
  if (!virtualEnabled.value || index < 0) return;
  const el = floatingRef.value;
  if (!el || !viewportHeight.value) return;
  const top = index * OPTION_HEIGHT;
  const bottom = top + OPTION_HEIGHT;
  if (top < el.scrollTop) {
    el.scrollTop = top;
    scrollTop.value = top;
  } else if (bottom > el.scrollTop + viewportHeight.value) {
    const next = bottom - viewportHeight.value;
    el.scrollTop = next;
    scrollTop.value = next;
  }
});

function onTriggerClick() {
  if (field.disabled.value) return;
  toggle();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (field.disabled.value) return;
  if ((event.key === 'ArrowDown' || event.key === 'Enter') && !isOpen.value) {
    event.preventDefault();
    open();
    nav.moveFirst();
    return;
  }
  if (isOpen.value) nav.onKeydown(event);
}

function pick(option: SelectOption) {
  // 写入经 select.model → onChange → applyChange，无需在此重复落值
  const changed = select.selectOption(option);
  if (!changed) return;
  if (!props.multiple) close();
}

function removeTag(event: MouseEvent, option: SelectOption) {
  event.stopPropagation();
  select.removeValue(option.value);
}

function clearSelection(event: MouseEvent) {
  event.stopPropagation();
  select.clear();
}
</script>

<template>
  <div class="cumquat-select" :class="field.error.value ? 'cumquat-select--invalid' : ''">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-select__trigger"
      :class="[
        isOpen ? 'cumquat-select__trigger--open' : '',
        multiple && select.selectedOptions.value.length ? 'cumquat-select__trigger--multiple' : '',
      ]"
      :disabled="field.disabled.value"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <template v-if="multiple">
        <span
          v-if="select.selectedOptions.value.length === 0 && !(filterable || fetch || subscribe)"
          class="cumquat-select__value cumquat-select__value--placeholder"
        >
          {{ placeholder }}
        </span>
        <span
          v-for="option in select.selectedOptions.value"
          :key="option.value"
          class="cumquat-select__tag"
        >
          {{ option.label }}
          <i
            v-if="!field.disabled.value"
            role="button"
            aria-label="移除"
            class="cumquat-select__tag-close"
            @click="removeTag($event, option)"
          >
            <svg
              class="cumquat-select__tag-close-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </i>
        </span>
        <!-- 多选同样支持搜索：标签之后追加输入框，无标签时以 placeholder 承载提示 -->
        <input
          v-if="filterable || fetch || subscribe"
          v-model="select.keyword.value"
          class="cumquat-select__search"
          :placeholder="select.selectedOptions.value.length ? '' : placeholder"
          :disabled="field.disabled.value"
          @click.stop="open()"
        />
      </template>
      <input
        v-else-if="filterable || fetch || subscribe"
        v-model="select.keyword.value"
        class="cumquat-select__search"
        :placeholder="String(select.selectedLabel.value ?? placeholder)"
        :disabled="field.disabled.value"
        @click.stop="open()"
      />
      <span
        v-else
        class="cumquat-select__value"
        :class="
          select.selectedLabel.value === undefined ? 'cumquat-select__value--placeholder' : ''
        "
      >
        {{ select.selectedLabel.value ?? placeholder }}
      </span>

      <i
        v-if="clearable && select.model.value !== null && !field.disabled.value"
        role="button"
        aria-label="清空"
        class="cumquat-select__clear"
        @click="clearSelection"
      >
        <svg
          class="cumquat-select__clear-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </i>
      <svg
        class="cumquat-select__arrow"
        :class="isOpen ? 'cumquat-select__arrow--open' : ''"
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

    <Transition name="cumquat-fade">
      <ul
        v-if="isOpen"
        ref="floatingRef"
        role="listbox"
        class="cumquat-select__dropdown"
        :style="dropdownStyle"
        @scroll="onDropdownScroll"
        @keydown="nav.onKeydown"
      >
        <!-- 窗口上方占位：撑出滚动距离，使虚拟滚动与真实列表高度一致 -->
        <li
          v-if="padTop > 0"
          class="cumquat-select__spacer"
          :style="{ height: `${padTop}px` }"
          aria-hidden="true"
        />

        <template v-for="row in displayRows" :key="row.key">
          <li v-if="row.type === 'group'" class="cumquat-select__group-title">{{ row.title }}</li>
          <li
            v-else
            role="option"
            :aria-selected="select.isSelected(row.option)"
            class="cumquat-select__option"
            :class="[
              row.option.disabled
                ? 'cumquat-select__option--disabled'
                : select.isSelected(row.option)
                  ? 'cumquat-select__option--active'
                  : '',
              nav.activeIndex.value === row.index ? 'cumquat-select__option--hover' : '',
            ]"
            :aria-disabled="row.option.disabled || undefined"
            @click="pick(row.option)"
            @mousemove="nav.setActiveIndex(row.index)"
          >
            {{ row.option.label }}
          </li>
        </template>

        <!-- 窗口下方占位 -->
        <li
          v-if="padBottom > 0"
          class="cumquat-select__spacer"
          :style="{ height: `${padBottom}px` }"
          aria-hidden="true"
        />

        <li v-if="remoteLoading" class="cumquat-select__loading cq-state--pending">加载中…</li>
        <li v-else-if="remoteError" class="cumquat-select__error cq-state--error">
          加载失败
          <button type="button" class="cumquat-select__retry" @click.stop="activeState?.retry?.()">
            重试
          </button>
        </li>
        <li v-else-if="select.filteredOptions.value.length === 0" class="cumquat-select__empty">
          暂无数据
        </li>
      </ul>
    </Transition>
  </div>
</template>
