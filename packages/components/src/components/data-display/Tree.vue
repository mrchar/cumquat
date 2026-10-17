<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useRovingFocus,
  useTreeModel,
  useTypeahead,
  type TreeFlatNode,
} from '@cumquat/composables';

export interface TreeNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    nodes: TreeNode[];
    /** 是否显示勾选框 */
    checkable?: boolean;
    defaultExpandAll?: boolean;
    /** 受控勾选集合（保存被点选的节点自身 key） */
    checked?: string[];
  }>(),
  { checkable: false, defaultExpandAll: false, checked: undefined },
);

const emit = defineEmits<{
  'update:checked': [keys: string[]];
  check: [keys: string[]];
  expand: [payload: { node: TreeNode; expanded: boolean }];
  'node-click': [node: TreeNode];
}>();

function collectParentKeys(nodes: TreeNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.key);
      collectParentKeys(node.children, acc);
    }
  }
  return acc;
}

const tree = useTreeModel<string>({
  data: () => props.nodes as unknown as Array<Record<string, unknown>>,
  fieldNames: { value: 'key' },
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
}

function toggleCheck(node: TreeFlatNode<string>) {
  tree.check(node.key);
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
        <button
          v-if="!flat.isLeaf"
          type="button"
          class="cumquat-tree__expander"
          :class="tree.isExpanded(flat.key) ? 'cumquat-tree__expander--expanded' : ''"
          :aria-label="tree.isExpanded(flat.key) ? '收起' : '展开'"
          @click.stop="toggleExpand(flat)"
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
          :disabled="flat.disabled"
          @change.stop="toggleCheck(flat)"
          @click.stop
        />

        <span class="cumquat-tree__label" @click.stop="!flat.isLeaf && toggleExpand(flat)">
          {{ flat.label }}
        </span>
      </div>
    </li>
  </ul>
</template>
