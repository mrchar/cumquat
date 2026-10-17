<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  useFloating,
  useListboxNavigation,
  useOpen,
  useSelectModel,
  useTreeModel,
  type TreeFlatNode,
} from '@cumquat/composables';

export interface TreeSelectNode {
  key: string;
  label: string;
  disabled?: boolean;
  children?: TreeSelectNode[];
}

const props = withDefaults(
  defineProps<{
    nodes: TreeSelectNode[];
    modelValue?: string | null;
    placeholder?: string;
    disabled?: boolean;
    /** 可搜索（关键词过滤并自动展开命中路径） */
    filterable?: boolean;
    defaultExpandAll?: boolean;
  }>(),
  {
    nodes: () => [],
    modelValue: undefined,
    placeholder: '请选择',
    disabled: false,
    filterable: false,
    defaultExpandAll: false,
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

const tree = useTreeModel<string>({
  data: () => props.nodes as unknown as Array<Record<string, unknown>>,
  fieldNames: { value: 'key' },
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
    else tree.toggleExpand(node.key);
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
              @click="!node.disabled && tree.toggleExpand(node.key)"
              @mouseenter="nav.setActiveIndex(index)"
            >
              <span
                v-for="level in node.depth"
                :key="level"
                class="cumquat-tree-select__indent"
                aria-hidden="true"
              />
              <button
                type="button"
                class="cumquat-tree-select__expander"
                :class="
                  tree.isExpanded(node.key) || searchActive
                    ? 'cumquat-tree-select__expander--expanded'
                    : ''
                "
                :aria-label="tree.isExpanded(node.key) ? '收起' : '展开'"
                @click.stop="tree.toggleExpand(node.key)"
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
        </ul>
      </div>
    </Transition>
  </div>
</template>
