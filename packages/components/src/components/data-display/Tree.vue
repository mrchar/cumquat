<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useActionValue,
  useFetchResource,
  useRovingFocus,
  useSubscribe,
  useTreeModel,
  useTypeahead,
  type TreeFlatNode,
} from '@cumquat/composables';
import type { ActionLike, Fetch, SubscribeHandler } from '@cumquat/composables';

export interface TreeNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeNode[];
  /** 远程懒加载时显式标记：true 叶子；false 表示子级尚未加载 */
  leaf?: boolean;
}

const props = withDefaults(
  defineProps<{
    nodes?: TreeNode[];
    /** 是否显示勾选框 */
    checkable?: boolean;
    defaultExpandAll?: boolean;
    /** 受控勾选集合（保存被点选的节点自身 key） */
    checked?: string[];
    /**
     * 统一远程请求：挂载拉取根节点；展开未加载节点时以
     * { filters: { parentKey } } 拉取子级，返回节点数组或 { list, total }
     */
    fetch?: Fetch<TreeNode>;
    /**
     * 订阅数据：挂载时调用，resolve 出的节点用于渲染（完整树，非懒加载）。
     * 优先级：subscribe > fetch > nodes
     */
    subscribe?: SubscribeHandler<TreeNode[]>;
    /** 勾选动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用勾选 */
    action?: ActionLike;
  }>(),
  {
    nodes: () => [],
    checkable: false,
    defaultExpandAll: false,
    checked: undefined,
    fetch: undefined,
    subscribe: undefined,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:checked': [keys: string[]];
  check: [keys: string[]];
  expand: [payload: { node: TreeNode; expanded: boolean }];
  'node-click': [node: TreeNode];
  /** 勾选动作失败（reject 或返回值导出错误）时触发，勾选已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 勾选动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

function collectParentKeys(nodes: TreeNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.key);
      collectParentKeys(node.children, acc);
    }
  }
  return acc;
}

/* ---------------- fetch：根节点挂载即拉，展开懒加载子级 ---------------- */
function findNode(nodes: TreeNode[], key: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.children) {
      const hit = findNode(node.children, key);
      if (hit) return hit;
    }
  }
  return undefined;
}

const {
  enabled: fetchEnabled,
  state: fetchState,
  refresh,
} = useFetchResource<TreeNode[]>(() => props.fetch, {
  getQuery: () => ({}),
  initialData: [] as TreeNode[],
  merge: (previous, next, query) => {
    const parentKey = query.filters?.parentKey as string | undefined;
    // 根结果直接替换；子结果挂到对应父节点
    if (parentKey === undefined) return next;
    const parent = findNode(previous, parentKey);
    if (parent) {
      parent.children = next;
      if (next.length === 0) parent.leaf = true;
    }
    return [...previous];
  },
});

/* ---------------- subscribe：订阅型数据（完整树） ---------------- */
const { state: subState } = useSubscribe<TreeNode[]>(() => props.subscribe);

const sourceNodes = computed<TreeNode[]>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data ?? [];
  return fetchEnabled.value ? applyRemoteLeaf(fetchState.value?.data ?? []) : props.nodes;
});

/**
 * 远程懒加载模式下 leaf 缺省视为「未知、可展开」（本地模式仍由 children 推导）；
 * 服务端用 leaf: true 显式标记叶子，空子级会在 merge 时回标为叶子。
 */
function applyRemoteLeaf(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((node) => ({
    ...node,
    leaf: node.leaf ?? false,
    children: node.children ? applyRemoteLeaf(node.children) : node.children,
  }));
}

/** 正在加载子级的节点 key 与最近失败的节点 key */
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

const rootState = computed(() => {
  if (props.subscribe) return sourceNodes.value.length === 0 ? subState.value : undefined;
  return fetchEnabled.value && sourceNodes.value.length === 0 ? fetchState.value : undefined;
});

const tree = useTreeModel<string>({
  data: () => sourceNodes.value as unknown as Array<Record<string, unknown>>,
  fieldNames: { value: 'key', isLeaf: 'leaf' },
  // 级联选中态由组件内联推导（保存节点自身 key），保证父节点勾选时模型为 [parentKey]
  cascade: false,
  modelValue: props.checked !== undefined ? () => props.checked : undefined,
  defaultValue: [],
  defaultExpandedKeys: props.defaultExpandAll ? collectParentKeys(props.nodes) : [],
  onChange: (keys) => {
    emit('update:checked', keys);
    emit('check', keys);
  },
});

const selfCheckedSet = computed(() => new Set(tree.checkedKeys.value));

/** 祖先链上是否存在被直接勾选的节点（向下传播的视觉全选） */
function ancestorSelfChecked(node: TreeFlatNode<string>): boolean {
  let parentKey = node.parentKey;
  while (parentKey !== null) {
    if (selfCheckedSet.value.has(parentKey)) return true;
    parentKey = tree.getNode(parentKey)?.parentKey ?? null;
  }
  return false;
}

/** 视觉勾选态：自身勾选 / 祖先全选 / 全部后代叶子勾选 */
function displayChecked(node: TreeFlatNode<string>): boolean {
  if (selfCheckedSet.value.has(node.key) || ancestorSelfChecked(node)) return true;
  // 远程未加载的父节点没有 leafKeys，不推导为全选
  if (node.leafKeys.length === 0) return false;
  return node.leafKeys.every((leaf) => selfCheckedSet.value.has(leaf));
}

/** 半选态：部分后代叶子被勾选 */
function displayIndeterminate(node: TreeFlatNode<string>): boolean {
  if (node.isLeaf || selfCheckedSet.value.has(node.key) || ancestorSelfChecked(node)) {
    return false;
  }
  const count = node.leafKeys.filter((leaf) => selfCheckedSet.value.has(leaf)).length;
  return count > 0 && count < node.leafKeys.length;
}

function toggleExpand(node: TreeFlatNode<string>) {
  const expanded = !tree.isExpanded(node.key);
  tree.toggleExpand(node.key);
  emit('expand', { node: node.raw as unknown as TreeNode, expanded });
  // 远程懒加载：展开一个尚未带子级的父节点时拉取子级
  const rawNode = node.raw as unknown as TreeNode;
  if (expanded && props.fetch && !node.isLeaf && !rawNode.children?.length) {
    void loadChildren(node.key);
  }
}

/** 展开器点击：子级加载失败时点击为重试 */
function onExpanderClick(node: TreeFlatNode<string>) {
  if (failedKey.value === node.key && !loadingKeys.value.includes(node.key)) {
    void loadChildren(node.key);
    return;
  }
  toggleExpand(node);
}

function toggleCheck(node: TreeFlatNode<string>) {
  if (actionPending.value) return;
  const previous = [...tree.checkedKeys.value];
  tree.check(node.key);
  if (!props.action) return;
  const next = [...tree.checkedKeys.value];
  void commitAction({
    execute: () => props.action?.(next),
    revert: () => tree.setCheckedKeys(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

function onRowClick(node: TreeFlatNode<string>) {
  emit('node-click', node.raw as unknown as TreeNode);
}

/* ---------- 键盘：roving 焦点 + 左右开合 + 首字匹配 ---------- */
const containerRef = ref<HTMLElement | null>(null);

const roving = useRovingFocus({
  count: () => tree.visibleNodes.value.length,
  isItemDisabled: (index) => !!tree.visibleNodes.value[index]?.disabled,
  orientation: 'vertical',
  autofocus: false,
  container: containerRef,
});

const typeahead = useTypeahead({
  getLabels: () => tree.visibleNodes.value.map((node) => node.label),
  startIndex: () => roving.activeIndex.value,
  onMatch: (index) => roving.setActiveIndex(index),
});

function onTreeKeydown(event: KeyboardEvent) {
  const node = tree.visibleNodes.value[roving.activeIndex.value];
  if (node) {
    if (event.key === 'ArrowRight' && !node.isLeaf && !tree.isExpanded(node.key)) {
      event.preventDefault();
      tree.setExpanded(node.key, true);
      return;
    }
    if (event.key === 'ArrowLeft') {
      if (!node.isLeaf && tree.isExpanded(node.key)) {
        event.preventDefault();
        tree.setExpanded(node.key, false);
        return;
      }
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (props.checkable && !node.disabled) toggleCheck(node);
      else if (!node.isLeaf) toggleExpand(node);
      return;
    }
  }
  roving.onKeydown(event);
  typeahead.onKeydown(event);
}
</script>

<template>
  <ul ref="containerRef" class="cumquat-tree" role="tree" @keydown="onTreeKeydown">
    <li v-if="rootState?.status === 'pending'" class="cumquat-tree__state cq-state--pending">
      加载中…
    </li>
    <li v-else-if="rootState?.status === 'error'" class="cumquat-tree__state cq-state--error">
      加载失败
      <button type="button" class="cumquat-tree__retry" @click.stop="rootState?.retry?.()">
        重试
      </button>
    </li>
    <li
      v-else-if="(fetchEnabled || subscribe) && tree.flatNodes.value.length === 0"
      class="cumquat-tree__state"
    >
      暂无数据
    </li>
    <template v-else>
      <li
        v-for="(flat, index) in tree.visibleNodes.value"
        :key="flat.key"
        class="cumquat-tree__node"
        :class="[
          flat.isLeaf ? 'cumquat-tree__node--leaf' : '',
          flat.disabled ? 'cumquat-tree__node--disabled' : '',
        ]"
        role="treeitem"
        :aria-expanded="flat.isLeaf ? undefined : tree.isExpanded(flat.key)"
      >
        <div
          class="cumquat-tree__row"
          :data-roving-index="index"
          :tabindex="roving.getTabIndex(index)"
          @focus="roving.onItemFocus(index)"
          @click="onRowClick(flat)"
        >
          <span
            v-for="level in flat.depth"
            :key="level"
            class="cumquat-tree__indent"
            aria-hidden="true"
          />
          <span
            v-if="loadingKeys.includes(flat.key)"
            class="cumquat-tree__expander cumquat-tree__expander--loading cq-state--pending"
            aria-label="加载中"
          />
          <button
            v-else-if="!flat.isLeaf"
            type="button"
            class="cumquat-tree__expander"
            :class="[
              tree.isExpanded(flat.key) ? 'cumquat-tree__expander--expanded' : '',
              failedKey === flat.key ? 'cumquat-tree__expander--error' : '',
            ]"
            :aria-label="tree.isExpanded(flat.key) ? '收起' : '展开'"
            @click.stop="onExpanderClick(flat)"
          >
            <svg
              class="cumquat-tree__expander-icon"
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
          <span v-else class="cumquat-tree__expander-placeholder" />

          <input
            v-if="checkable"
            type="checkbox"
            class="cumquat-tree__checkbox"
            :checked="displayChecked(flat)"
            :indeterminate.prop="displayIndeterminate(flat)"
            :disabled="flat.disabled || actionPending"
            @change.stop="toggleCheck(flat)"
            @click.stop
          />

          <span class="cumquat-tree__label" @click.stop="!flat.isLeaf && toggleExpand(flat)">
            {{ flat.label }}
          </span>
        </div>
      </li>
    </template>
  </ul>
</template>
