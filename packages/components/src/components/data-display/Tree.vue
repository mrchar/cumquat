<script setup lang="ts">
import { computed, ref } from 'vue';

export interface TreeNode {
  key: string;
  label: string;
  children?: TreeNode[];
}

const props = withDefaults(
  defineProps<{
    nodes: TreeNode[];
    /** 是否显示勾选框 */
    checkable?: boolean;
    defaultExpandAll?: boolean;
  }>(),
  { checkable: false, defaultExpandAll: false },
);

const checked = defineModel<string[]>('checked', { default: () => [] });

/** 展开的节点 key 集合 */
const expanded = ref<Set<string>>(new Set(props.defaultExpandAll ? collectKeys(props.nodes) : []));

function collectKeys(nodes: TreeNode[], acc: string[] = []): string[] {
  for (const node of nodes) {
    if (node.children?.length) {
      acc.push(node.key);
      collectKeys(node.children, acc);
    }
  }
  return acc;
}

interface FlatNode {
  node: TreeNode;
  depth: number;
  hasChildren: boolean;
}

const visibleNodes = computed<FlatNode[]>(() => {
  const list: FlatNode[] = [];
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      const hasChildren = !!node.children?.length;
      list.push({ node, depth, hasChildren });
      if (hasChildren && expanded.value.has(node.key)) {
        walk(node.children!, depth + 1);
      }
    }
  };
  walk(props.nodes, 0);
  return list;
});

function toggleExpand(node: TreeNode) {
  const next = new Set(expanded.value);
  if (next.has(node.key)) {
    next.delete(node.key);
  } else {
    next.add(node.key);
  }
  expanded.value = next;
}

function isChecked(key: string) {
  return checked.value.includes(key);
}

function toggleCheck(node: TreeNode) {
  const next = checked.value.includes(node.key)
    ? checked.value.filter((k) => k !== node.key)
    : [...checked.value, node.key];
  checked.value = next;
}
</script>

<template>
  <ul class="cumquat-tree" role="tree">
    <li
      v-for="{ node, depth, hasChildren } in visibleNodes"
      :key="node.key"
      class="cumquat-tree__node"
      role="treeitem"
      :aria-expanded="hasChildren ? expanded.has(node.key) : undefined"
    >
      <div class="cumquat-tree__row" :style="{ paddingLeft: `${depth * 1.25 + 0.5}rem` }">
        <button
          v-if="hasChildren"
          type="button"
          class="cumquat-tree__expander"
          :class="expanded.has(node.key) ? 'cumquat-tree__expander--expanded' : ''"
          :aria-label="expanded.has(node.key) ? '收起' : '展开'"
          @click.stop="toggleExpand(node)"
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
          :checked="isChecked(node.key)"
          @change.stop="toggleCheck(node)"
        />

        <span class="cumquat-tree__label" @click="hasChildren && toggleExpand(node)">
          {{ node.label }}
        </span>
      </div>
    </li>
  </ul>
</template>
