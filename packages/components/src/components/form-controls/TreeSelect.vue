<script setup lang="ts">
import { computed, ref } from 'vue';

export interface TreeSelectNode {
  key: string;
  label: string;
  children?: TreeSelectNode[];
}

const props = withDefaults(
  defineProps<{
    nodes: TreeSelectNode[];
    placeholder?: string;
  }>(),
  { nodes: () => [], placeholder: '请选择' },
);

const open = ref(false);
const model = defineModel<string | null>({ default: null });

/** 面板展开的一级节点 key 集合 */
const expanded = ref<Set<string>>(new Set());

const selectedLabel = computed(() => {
  for (const node of props.nodes) {
    if (node.key === model.value) return node.label;
    const child = node.children?.find((c) => c.key === model.value);
    if (child) return `${node.label} / ${child.label}`;
  }
  return '';
});

function toggle(node: TreeSelectNode) {
  const next = new Set(expanded.value);
  if (next.has(node.key)) {
    next.delete(node.key);
  } else {
    next.add(node.key);
  }
  expanded.value = next;
}

function pick(node: TreeSelectNode) {
  if (node.children?.length) return;
  model.value = node.key;
  open.value = false;
}
</script>

<template>
  <div class="cumquat-tree-select">
    <button
      type="button"
      class="cumquat-tree-select__trigger"
      :class="open ? 'cumquat-tree-select__trigger--open' : ''"
      @click="open = !open"
    >
      <span
        class="cumquat-tree-select__value"
        :class="selectedLabel ? '' : 'cumquat-tree-select__value--placeholder'"
      >
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="cumquat-tree-select__arrow"
        :class="open ? 'cumquat-tree-select__arrow--open' : ''"
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
      <div v-if="open" class="cumquat-tree-select__panel">
        <template v-for="node in nodes" :key="node.key">
          <div
            class="cumquat-tree-select__node"
            @click="node.children?.length ? toggle(node) : pick(node)"
          >
            <button
              v-if="node.children?.length"
              type="button"
              class="cumquat-tree-select__expander"
              :class="expanded.has(node.key) ? 'cumquat-tree-select__expander--expanded' : ''"
              :aria-label="expanded.has(node.key) ? '收起' : '展开'"
              @click.stop="toggle(node)"
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
            <span v-else class="cumquat-tree-select__expander-spacer" />
            {{ node.label }}
          </div>
          <template v-if="node.children?.length && expanded.has(node.key)">
            <div
              v-for="child in node.children"
              :key="child.key"
              class="cumquat-tree-select__leaf"
              :class="child.key === model ? 'cumquat-tree-select__leaf--active' : ''"
              @click="pick(child)"
            >
              {{ child.label }}
            </div>
          </template>
        </template>
      </div>
    </Transition>
  </div>
</template>
