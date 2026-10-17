<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  useFetchResource,
  useFloating,
  useListboxNavigation,
  useOpen,
  useSelectModel,
  useTreeModel,
  type TreeFlatNode,
} from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

export interface TreeSelectNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeSelectNode[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}

const props = withDefaults(
  defineProps<{
    nodes?: TreeSelectNode[];
    modelValue?: string | null;
    placeholder?: string;
    disabled?: boolean;
    /** 可搜索（关键词过滤并自动展开命中路径） */
    filterable?: boolean;
    defaultExpandAll?: boolean;
    /**
     * 统一远程请求：挂载拉取根节点；展开未加载节点时以
     * { filters: { parentKey } } 拉取子级，返回节点数组或 { list, total }
     */
    fetch?: Fetch<TreeSelectNode>;
  }>(),
  {
    nodes: () => [],
    modelValue: undefined,
    placeholder: '请选择',
    disabled: false,
    filterable: false,
    defaultExpandAll: false,
    fetch: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  change: [value: string | null];
}>();

const { isOpen, toggle, close } = useOpen();
const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

function collectParentKeys(nodes: TreeSelectNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.key);
      collectParentKeys(node.children, acc);
    }
  }
  return acc;
}

function findNode(nodes: TreeSelectNode[], key: string): TreeSelectNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const hit = findNode(node.children, key);
      if (hit) return hit;
    }
  }
  return undefined;
}

/* ---------------- fetch：根节点挂载即拉，展开懒加载子级 ---------------- */
const {
  enabled: fetchEnabled,
  state: fetchState,
  refresh,
} = useFetchResource<TreeSelectNode[]>(() => props.fetch, {
  getQuery: () => ({}),
  initialData: [] as TreeSelectNode[],
  merge: (previous, next, query) => {
    const parentKey = query.filters?.parentKey as string | undefined;
    if (parentKey === undefined) return next;
    const parent = findNode(previous, parentKey);
    if (parent) {
      parent.children = next;
      if (next.length === 0) parent.leaf = true;
    }
    return [...previous];
  },
});

const sourceNodes = computed<TreeSelectNode[]>(() =>
  fetchEnabled.value ? applyRemoteLeaf(fetchState.value?.data ?? []) : props.nodes,
);

/** 远程懒加载模式下 leaf 缺省视为「未知、可展开」，叶子由服务端显式标记 */
function applyRemoteLeaf(nodes: TreeSelectNode[]): TreeSelectNode[] {
  return nodes.map((node) => ({
    ...node,
    leaf: node.leaf ?? false,
    children: node.children ? applyRemoteLeaf(node.children) : node.children,
  }));
}

const loadingKeys = ref<string[]>([]);
const failedKey = ref<string | null>(null);

async function loadChildren(key: string) {
  if (loadingKeys.value.includes(key)) return;
  failedKey.value = null;
  loadingKeys.value = [...loadingKeys.value, key];
  await refresh({ filters: { parentKey: key } });
  loadingKeys.value = loadingKeys.value.filter((item) => item !== key);
  if (fetchState.value?.status === 'error') failedKey.value = key;
}

/** 展开节点；远程未加载父节点顺带拉取子级，失败时为重试 */
function expandNode(node: TreeFlatNode<string>) {
  if (failedKey.value === node.key && !loadingKeys.value.includes(node.key)) {
    void loadChildren(node.key);
    return;
  }
  const expanded = !tree.isExpanded(node.key);
  tree.toggleExpand(node.key);
  const rawNode = node.raw as unknown as TreeSelectNode;
  if (expanded && props.fetch && !node.isLeaf && !rawNode.children?.length) {
    void loadChildren(node.key);
  }
}

const rootState = computed(() =>
  fetchEnabled.value && sourceNodes.value.length === 0 ? fetchState.value : undefined,
);

const tree = useTreeModel<string>({
  data: () => sourceNodes.value as unknown as Array<Record<string, unknown>>,
  fieldNames: { value: 'key', isLeaf: 'leaf' },
  cascade: false,
  defaultExpandedKeys: props.defaultExpandAll ? collectParentKeys(props.nodes) : [],
});

/** 叶子节点路径，用于标签回显 */
function pathLabels(node: TreeFlatNode<string>): string[] {
  const labels: string[] = [node.label];
  let parentKey = node.parentKey;
  while (parentKey !== null) {
    const parent = tree.getNode(parentKey);
    if (!parent) break;
    labels.unshift(parent.label);
    parentKey = parent.parentKey;
  }
  return labels;
}

const leafOptions = computed(() =>
  tree.flatNodes.value
    .filter((node) => node.isLeaf)
    .map((node) => ({ value: node.key, label: pathLabels(node).join(' / ') })),
);

const selectModel = useSelectModel<string, string>({
  options: leafOptions,
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    emit('update:modelValue', (value as string | null) ?? null);
    emit('change', (value as string | null) ?? null);
  },
});

/* ---------- 搜索：命中节点及其祖先链展开 ---------- */
const keyword = ref('');
const searchActive = computed(() => props.filterable && keyword.value.trim().length > 0);

const visibleNodes = computed(() => {
  if (!searchActive.value) return tree.visibleNodes.value;
  const word = keyword.value.trim().toLowerCase();
  const matched = new Set<string>();
  for (const node of tree.flatNodes.value) {
    if (node.label.toLowerCase().includes(word)) {
      let current: TreeFlatNode<string> | undefined = node;
      while (current) {
        matched.add(current.key);
        current = current.parentKey === null ? undefined : tree.getNode(current.parentKey);
      }
    }
  }
  return tree.flatNodes.value.filter((node) => matched.has(node.key));
});

watch(searchActive, (active) => {
  if (active) tree.expandAll();
});

const selectedLabel = computed(() => selectModel.selectedLabel.value ?? '');

const nav = useListboxNavigation({
  count: () => visibleNodes.value.length,
  isItemDisabled: (index) => !!visibleNodes.value[index]?.disabled,
  onSelect: (index) => {
    const node = visibleNodes.value[index];
    if (!node || node.disabled) return;
    if (node.isLeaf) pickLeaf(node);
    else expandNode(node);
  },
});

function pickLeaf(node: TreeFlatNode<string>) {
  selectModel.selectOption({ value: node.key, label: pathLabels(node).join(' / ') });
  close();
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (!isOpen.value && (event.key === 'ArrowDown' || event.key === 'Enter')) {
    event.preventDefault();
    isOpen.value = true;
    nav.setActiveIndex(0);
    return;
  }
  if (event.key === 'Escape') {
    close();
    return;
  }
  nav.onKeydown(event);
}

function onSearchInput(event: Event) {
  keyword.value = (event.target as HTMLInputElement).value;
  nav.setActiveIndex(0);
}
</script>

<template>
  <div class="cumquat-tree-select">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-tree-select__trigger"
      :class="isOpen ? 'cumquat-tree-select__trigger--open' : ''"
      :disabled="disabled"
      @click="toggle()"
      @keydown="onTriggerKeydown"
    >
      <span
        class="cumquat-tree-select__value"
        :class="selectedLabel ? '' : 'cumquat-tree-select__value--placeholder'"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="cumquat-tree-select__arrow"
        :class="isOpen ? 'cumquat-tree-select__arrow--open' : ''"
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
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="cumquat-tree-select__panel"
        :style="floatingStyles"
      >
        <div v-if="filterable" class="cumquat-tree-select__search">
          <input
            :value="keyword"
            type="text"
            class="cumquat-tree-select__search-input"
            placeholder="搜索节点"
            @input="onSearchInput"
            @keydown="nav.onKeydown"
          />
        </div>
        <ul class="cumquat-tree-select__tree" role="tree">
          <li
            v-if="rootState?.status === 'pending'"
            class="cumquat-tree-select__state cq-state--pending"
          >
            加载中…
          </li>
          <li
            v-else-if="rootState?.status === 'error'"
            class="cumquat-tree-select__state cq-state--error"
          >
            加载失败
            <button
              type="button"
              class="cumquat-tree-select__retry"
              @click.stop="rootState?.retry?.()"
            >
              重试
            </button>
          </li>
          <li
            v-else-if="fetchEnabled && tree.flatNodes.value.length === 0"
            class="cumquat-tree-select__state"
          >
            暂无数据
          </li>
          <template v-else>
            <li
              v-for="(node, index) in visibleNodes"
              :key="node.key"
              role="treeitem"
              :aria-expanded="node.isLeaf ? undefined : tree.isExpanded(node.key)"
            >
              <div
                v-if="node.isLeaf"
                class="cumquat-tree-select__leaf"
                :class="[
                  selectModel.model.value === node.key ? 'cumquat-tree-select__leaf--active' : '',
                  node.disabled ? 'cumquat-tree-select__leaf--disabled' : '',
                ]"
                :data-roving-index="index"
                @click="!node.disabled && pickLeaf(node)"
                @mouseenter="nav.setActiveIndex(index)"
              >
                <span
                  v-for="level in node.depth"
                  :key="level"
                  class="cumquat-tree-select__indent"
                  aria-hidden="true"
                />
                {{ node.label }}
              </div>
              <div
                v-else
                class="cumquat-tree-select__node"
                :class="node.disabled ? 'cumquat-tree-select__node--disabled' : ''"
                :data-roving-index="index"
                @click="!node.disabled && expandNode(node)"
                @mouseenter="nav.setActiveIndex(index)"
              >
                <span
                  v-for="level in node.depth"
                  :key="level"
                  class="cumquat-tree-select__indent"
                  aria-hidden="true"
                />
                <span
                  v-if="loadingKeys.includes(node.key)"
                  class="cumquat-tree-select__expander cumquat-tree-select__expander--loading cq-state--pending"
                />
                <button
                  v-else
                  type="button"
                  class="cumquat-tree-select__expander"
                  :class="[
                    tree.isExpanded(node.key) || searchActive
                      ? 'cumquat-tree-select__expander--expanded'
                      : '',
                    failedKey === node.key ? 'cumquat-tree-select__expander--error' : '',
                  ]"
                  :aria-label="tree.isExpanded(node.key) ? '收起' : '展开'"
                  @click.stop="expandNode(node)"
                >
                  <svg
                    class="cumquat-tree-select__expander-icon"
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
                {{ node.label }}
              </div>
            </li>
          </template>
        </ul>
      </div>
    </Transition>
  </div>
</template>
