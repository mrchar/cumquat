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
  <div class="cumquat-tree-select relative inline-block w-full">
    <button
      type="button"
      class="cumquat-tree-select__trigger flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-cumquat border px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cumquat-accent/20"
      :class="open ? 'border-cumquat-accent' : 'border-cumquat-border'"
      @click="open = !open"
    >
      <span :class="selectedLabel ? 'text-cumquat-text' : 'text-cumquat-text-muted'">
        {{ selectedLabel || placeholder }}
      </span>
      <svg
        class="cumquat-tree-select__arrow size-4 text-cumquat-text-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
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
        v-if="open"
        class="cumquat-tree-select__panel absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-cumquat border border-cumquat-border bg-cumquat-surface py-1.5 shadow-cumquat-overlay"
      >
        <template v-for="node in nodes" :key="node.key">
          <div
            class="cumquat-tree-select__node flex cursor-pointer items-center gap-1.5 px-3 py-2 text-sm text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
            @click="node.children?.length ? toggle(node) : pick(node)"
          >
            <button
              v-if="node.children?.length"
              type="button"
              class="cumquat-tree-select__expander flex size-4 cursor-pointer items-center justify-center text-cumquat-text-muted transition-transform"
              :class="expanded.has(node.key) ? 'rotate-90' : ''"
              :aria-label="expanded.has(node.key) ? '收起' : '展开'"
              @click.stop="toggle(node)"
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
            {{ node.label }}
          </div>
          <template v-if="node.children?.length && expanded.has(node.key)">
            <div
              v-for="child in node.children"
              :key="child.key"
              class="cumquat-tree-select__leaf cursor-pointer py-2 pl-10 pr-3 text-sm transition-colors"
              :class="
                child.key === model
                  ? 'bg-cumquat-accent-soft font-medium text-cumquat-accent'
                  : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
              "
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
