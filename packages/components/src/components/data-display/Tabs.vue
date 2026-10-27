<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  useActionValue,
  useControllableModel,
  useFetchResource,
  useRovingFocus,
  useSubscribe,
} from '@cumquat/composables';
import type { ActionLike, Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from '../basic/Button.vue';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  closable?: boolean;
}

const props = withDefaults(
  defineProps<{
    tabs?: TabItem[];
    modelValue?: string;
    /** 允许增减页签（触发 add/remove 事件，数据由外层维护） */
    editable?: boolean;
    addText?: string;
    /** 面板懒渲染：首次激活后才挂载内容，默认 true */
    lazy?: boolean;
    /** 统一远程请求：挂载即拉取页签项，返回数组或 { list, total } */
    fetch?: Fetch<TabItem>;
    /**
     * 订阅数据：挂载时调用，resolve 出的页签项用于渲染。
     * 优先级：subscribe > fetch > tabs
     */
    subscribe?: SubscribeHandler<TabItem[]>;
    /** 切换动作：配置后先确认再切换（成功才激活新页签，失败停留原面板） */
    action?: ActionLike;
  }>(),
  {
    tabs: () => [],
    modelValue: undefined,
    editable: false,
    addText: '+',
    lazy: true,
    fetch: undefined,
    subscribe: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [key: string];
  change: [key: string];
  add: [];
  remove: [tab: TabItem];
  /** 切换动作失败（reject 或返回值导出错误）时触发，停留在原面板 */
  actionError: [error: unknown];
}>();

/* ---------------- action 切换动作：先确认再切换，失败停留 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

const { value: active } = useControllableModel<string>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: '',
  fallback: '',
  onChange: (key) => {
    emit('update:modelValue', key);
    emit('change', key);
  },
});

function activate(key: string) {
  active.value = key;
  visitedKeys.value.add(key);
}

/** 用户切换统一入口：无 action 乐观切换；有 action 先确认，成功才切换 */
function requestActivate(key: string, index?: number) {
  if (!props.action) {
    if (index !== undefined) nav.setActiveIndex(index);
    activate(key);
    return;
  }
  void commitAction({ execute: () => props.action?.(key) }).then((ok) => {
    if (!ok) {
      if (actionError.value != null) emit('actionError', actionError.value);
      return;
    }
    if (index !== undefined) nav.setActiveIndex(index);
    activate(key);
  });
}

/** 已访问过的页签（懒渲染依据） */
const visitedKeys = ref<Set<string>>(new Set(active.value ? [active.value] : []));

/* ---------------- fetch：挂载即拉页签，首个可用页签自动激活 ---------------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<TabItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as TabItem[] },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<TabItem[]>(() => props.subscribe);

const sourceTabs = computed<TabItem[]>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data ?? [];
  return fetchEnabled.value ? (fetchState.value?.data ?? []) : props.tabs;
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

const enabledIndex = (index: number) =>
  !!sourceTabs.value[index] && !sourceTabs.value[index].disabled;

const nav = useRovingFocus({
  count: () => sourceTabs.value.length,
  isItemDisabled: (index) => !enabledIndex(index),
  orientation: 'horizontal',
  autofocus: false,
});

watch(sourceTabs, (tabs) => {
  // 远程数据就绪后，未指定激活项时自动选中第一个可用页签
  if (
    (fetchEnabled.value || props.subscribe) &&
    tabs.length > 0 &&
    (!active.value || !tabs.some((tab) => tab.key === active.value))
  ) {
    const first = tabs.find((tab) => !tab.disabled);
    if (first) {
      nav.setActiveIndex(tabs.indexOf(first));
      activate(first.key);
    }
    return;
  }
  const current = tabs[nav.activeIndex.value];
  if (!current || current.disabled) {
    const first = tabs.find((tab) => !tab.disabled);
    if (first) nav.setActiveIndex(tabs.indexOf(first));
  }
});

function onClickTab(tab: TabItem, index: number) {
  if (tab.disabled || actionPending.value) return;
  requestActivate(tab.key, index);
}

function onNavKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (actionPending.value) return;
    const tab = sourceTabs.value[nav.activeIndex.value];
    if (tab && !tab.disabled) requestActivate(tab.key);
    return;
  }
  nav.onKeydown(event);
}

function onAdd() {
  emit('add');
}

function onRemove(event: MouseEvent, tab: TabItem) {
  event.stopPropagation();
  emit('remove', tab);
}

const panelMounted = computed(() => !props.lazy || visitedKeys.value.size > 0 || !!active.value);
</script>

<template>
  <div class="cumquat-tabs">
    <div role="tablist" class="cumquat-tabs__nav" @keydown="onNavKeydown">
      <button
        v-for="(tab, index) in sourceTabs"
        :key="tab.key"
        type="button"
        role="tab"
        :data-roving-index="index"
        :aria-selected="tab.key === active"
        :tabindex="nav.getTabIndex(index)"
        :disabled="tab.disabled || actionPending"
        class="cumquat-tabs__tab"
        :class="tab.key === active ? 'cumquat-tabs__tab--active' : ''"
        @focus="nav.onItemFocus(index)"
        @click="onClickTab(tab, index)"
      >
        {{ tab.label }}
        <i
          v-if="editable && tab.closable !== false"
          role="button"
          aria-label="关闭页签"
          class="cumquat-tabs__close"
          @click="onRemove($event, tab)"
        />
      </button>
      <span
        v-if="remoteLoading && sourceTabs.length === 0"
        class="cumquat-tabs__state cq-state--pending"
      >
        加载中…
      </span>
      <span
        v-else-if="remoteError && sourceTabs.length === 0"
        class="cumquat-tabs__state cq-state--error"
      >
        加载失败
        <CqButton size="sm" type="ghost" class="cumquat-tabs__retry" @click="retryRemote">重试</CqButton>
      </span>
      <span
        v-else-if="(fetchEnabled || subscribe) && sourceTabs.length === 0"
        class="cumquat-tabs__state"
      >
        暂无页签
      </span>
      <button
        v-if="editable"
        type="button"
        aria-label="新增页签"
        class="cumquat-tabs__add"
        @click="onAdd"
      >
        {{ addText }}
      </button>
    </div>
    <div v-if="$slots.default && panelMounted" role="tabpanel" class="cumquat-tabs__panel">
      <slot :active="active" />
    </div>
  </div>
</template>
