<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useControllableModel,
  useFetchResource,
  useRovingFocus,
  useTypeahead,
} from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

export interface MenuItem {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: string;
  children?: MenuItem[];
}

const props = withDefaults(
  defineProps<{
    items?: MenuItem[];
    modelValue?: string;
    /** 折叠模式：仅展示图标，子菜单弹出（class 开关，数据同构） */
    collapsed?: boolean;
    /** 默认展开的分组 key 列表 */
    defaultExpandedKeys?: string[];
    /** 统一远程请求：挂载即拉取菜单项，返回数组或 { list, total } */
    fetch?: Fetch<MenuItem>;
  }>(),
  {
    items: () => [],
    modelValue: undefined,
    collapsed: false,
    defaultExpandedKeys: () => [],
    fetch: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [key: string];
  select: [item: MenuItem];
}>();

const { value: active } = useControllableModel<string>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: '',
  fallback: '',
  onChange: (key) => emit('update:modelValue', key),
});

/** 当前展开的分组 key 集合 */
const expanded = ref<Set<string>>(new Set(props.defaultExpandedKeys));

function isExpanded(key: string) {
  return expanded.value.has(key);
}

function toggleGroup(item: MenuItem) {
  const next = new Set(expanded.value);
  if (next.has(item.key)) next.delete(item.key);
  else next.add(item.key);
  expanded.value = next;
}

function pick(item: MenuItem) {
  if (item.disabled) return;
  active.value = item.key;
  emit('select', item);
}

/* ---------------- fetch：挂载即拉菜单项 ---------------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<MenuItem[]>(
  () => props.fetch,
  { getQuery: () => ({}), initialData: [] as MenuItem[] },
);

const sourceItems = computed<MenuItem[]>(() =>
  fetchEnabled.value ? (fetchState.value?.data ?? []) : props.items,
);
const remoteLoading = computed(() => fetchState.value?.status === 'pending');
const remoteError = computed(() =>
  fetchState.value?.status === 'error' ? fetchState.value.error : undefined,
);

/** 扁平化可见叶子项：roving 焦点与 typeahead 共用一份索引 */
interface FlatEntry {
  item: MenuItem;
  depth: number;
}
const flatLeaves = computed<FlatEntry[]>(() => {
  const list: FlatEntry[] = [];
  for (const item of sourceItems.value) {
    if (item.children && item.children.length > 0) {
      if (!props.collapsed && isExpanded(item.key)) {
        for (const child of item.children) list.push({ item: child, depth: 1 });
      }
    } else {
      list.push({ item, depth: 0 });
    }
  }
  return list;
});

const nav = useRovingFocus({
  count: () => flatLeaves.value.length,
  isItemDisabled: (index) => !!flatLeaves.value[index]?.item.disabled,
  orientation: 'vertical',
  autofocus: false,
});

const typeahead = useTypeahead({
  getLabels: () => flatLeaves.value.map((entry) => entry.item.label),
  onMatch: (index) => {
    const entry = flatLeaves.value[index];
    if (entry) {
      nav.setActiveIndex(index);
      pick(entry.item);
    }
  },
});

function onNavKeydown(event: KeyboardEvent) {
  if (event.key.length === 1) typeahead.onKeydown(event);
  else nav.onKeydown(event);
}
</script>

<template>
  <nav
    class="cumquat-menu"
    :class="collapsed ? 'cumquat-menu--collapsed' : ''"
    @keydown="onNavKeydown"
  >
    <p
      v-if="remoteLoading && sourceItems.length === 0"
      class="cumquat-menu__state cq-state--pending"
    >
      加载中…
    </p>
    <p
      v-else-if="remoteError && sourceItems.length === 0"
      class="cumquat-menu__state cq-state--error"
    >
      加载失败
      <button type="button" class="cumquat-menu__retry" @click="fetchState?.retry?.()">重试</button>
    </p>
    <p v-else-if="fetchEnabled && sourceItems.length === 0" class="cumquat-menu__state">暂无菜单</p>
    <template v-for="item in sourceItems" :key="item.key">
      <!-- 分组 -->
      <template v-if="item.children && item.children.length > 0">
        <button
          type="button"
          class="cumquat-menu__group"
          :aria-expanded="isExpanded(item.key)"
          @click="toggleGroup(item)"
        >
          <span v-if="item.icon" class="cumquat-menu__icon">{{ item.icon }}</span>
          <span class="cumquat-menu__label">{{ item.label }}</span>
          <svg
            class="cumquat-menu__chevron"
            :class="isExpanded(item.key) ? 'cumquat-menu__chevron--expanded' : ''"
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
        <div v-if="!collapsed && isExpanded(item.key)" class="cumquat-menu__subgroup">
          <button
            v-for="child in item.children"
            :key="child.key"
            type="button"
            class="cumquat-menu__item"
            :class="
              child.key === active ? 'cumquat-menu__item--active' : 'cumquat-menu__item--inactive'
            "
            :disabled="child.disabled"
            :data-roving-index="flatLeaves.findIndex((entry) => entry.item.key === child.key)"
            :tabindex="
              nav.getTabIndex(flatLeaves.findIndex((entry) => entry.item.key === child.key))
            "
            @focus="nav.onItemFocus(flatLeaves.findIndex((entry) => entry.item.key === child.key))"
            @click="pick(child)"
          >
            {{ child.label }}
          </button>
        </div>
      </template>
      <!-- 叶子项 -->
      <button
        v-else
        type="button"
        class="cumquat-menu__item"
        :class="item.key === active ? 'cumquat-menu__item--active' : 'cumquat-menu__item--inactive'"
        :disabled="item.disabled"
        :data-roving-index="flatLeaves.findIndex((entry) => entry.item.key === item.key)"
        :tabindex="nav.getTabIndex(flatLeaves.findIndex((entry) => entry.item.key === item.key))"
        @focus="nav.onItemFocus(flatLeaves.findIndex((entry) => entry.item.key === item.key))"
        @click="pick(item)"
      >
        <span v-if="item.icon" class="cumquat-menu__icon">{{ item.icon }}</span>
        <span class="cumquat-menu__label">{{ item.label }}</span>
      </button>
    </template>
  </nav>
</template>
