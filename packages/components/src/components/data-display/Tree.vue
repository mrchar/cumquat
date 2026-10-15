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
  <ul class="cumquat-tree flex flex-col gap-0.5 text-sm" role="tree">
    <li
      v-for="{ node, depth, hasChildren } in visibleNodes"
      :key="node.key"
      class="cumquat-tree__node"
      role="treeitem"
      :aria-expanded="hasChildren ? expanded.has(node.key) : undefined"
    >
      <div
        class="cumquat-tree__row flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 transition-colors hover:bg-cumquat-surface-2"
        :style="{ paddingLeft: `${depth * 1.25 + 0.5}rem` }"
      >
        <button
          v-if="hasChildren"
          type="button"
          class="cumquat-tree__expander flex size-4 cursor-pointer items-center justify-center text-cumquat-text-muted transition-transform"
          :class="expanded.has(node.key) ? 'rotate-90' : ''"
          :aria-label="expanded.has(node.key) ? '收起' : '展开'"
          @click.stop="toggleExpand(node)"
        >
          <svg
            class="size-3.5"
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
        <span v-else class="size-4 shrink-0" />

        <input
          v-if="checkable"
          type="checkbox"
          class="cumquat-tree__checkbox size-3.5 cursor-pointer accent-cumquat-accent"
          :checked="isChecked(node.key)"
          @change.stop="toggleCheck(node)"
        />

        <span
          class="cumquat-tree__label text-cumquat-text"
          @click="hasChildren && toggleExpand(node)"
        >
          {{ node.label }}
        </span>
      </div>
    </li>
  </ul>
</template>
