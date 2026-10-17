import { computed } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { toValue } from 'vue';
import { useControllableModel } from '../core/useControllableModel';

export interface TreeFieldNames {
  value: string;
  label: string;
  children: string;
  disabled: string;
  /** 叶子标记字段；显式 false 表示“尚未加载子级”的父节点（远程懒加载） */
  isLeaf: string;
}

export interface TreeFlatNode<V = string | number> {
  key: V;
  label: string;
  depth: number;
  disabled: boolean;
  isLeaf: boolean;
  parentKey: V | null;
  childKeys: V[];
  /** 全部后代叶子的 key（含自身为叶子的情况） */
  leafKeys: V[];
  /** 原始数据节点 */
  raw: Record<string, unknown>;
}

export interface UseTreeModelOptions<V = string | number> {
  data: MaybeRefOrGetter<Array<Record<string, unknown>>>;
  fieldNames?: Partial<TreeFieldNames>;
  /** 勾选值（受控） */
  modelValue?: V[];
  defaultValue?: V[];
  onChange?: (keys: V[]) => void;
  /** 展开值（受控） */
  expandedKeys?: V[];
  defaultExpandedKeys?: V[];
  onExpandedChange?: (keys: V[]) => void;
  /** 父子是否联动勾选，默认 true；false 时只切换节点自身 */
  cascade?: boolean;
}

export interface UseTreeModelReturn<V = string | number> {
  /** 扁平化的全部节点 */
  flatNodes: ComputedRef<Array<TreeFlatNode<V>>>;
  /** 当前可见节点（受展开集合过滤），按深度优先顺序 */
  visibleNodes: ComputedRef<Array<TreeFlatNode<V>>>;
  checkedKeys: Ref<V[]>;
  expandedKeys: Ref<V[]>;
  getNode: (key: V) => TreeFlatNode<V> | undefined;
  isExpanded: (key: V) => boolean;
  setExpanded: (key: V, expanded: boolean) => void;
  toggleExpand: (key: V) => void;
  expandAll: () => void;
  collapseAll: () => void;
  isChecked: (key: V) => boolean;
  isIndeterminate: (key: V) => boolean;
  halfCheckedKeys: ComputedRef<V[]>;
  check: (key: V, checked?: boolean) => void;
  setCheckedKeys: (keys: V[]) => void;
}

const DEFAULT_FIELDS: TreeFieldNames = {
  value: 'value',
  label: 'label',
  children: 'children',
  disabled: 'disabled',
  isLeaf: 'isLeaf',
};

/**
 * 树形数据模型：展开集合、勾选集合（级联传播与半选推导）、
 * 可见节点扁平化。不渲染任何缩进 / 连接线（由组件内联）。
 *
 * @internal 消费组件：Tree、TreeSelect
 */
export function useTreeModel<V extends string | number = string | number>(
  options: UseTreeModelOptions<V>,
): UseTreeModelReturn<V> {
  const {
    data,
    fieldNames: fieldOverrides,
    modelValue,
    defaultValue,
    onChange,
    expandedKeys: expandedProp,
    defaultExpandedKeys,
    onExpandedChange,
    cascade = true,
  } = options;

  const fields: TreeFieldNames = { ...DEFAULT_FIELDS, ...fieldOverrides };

  // 1. 扁平化原始树
  const flatNodes = computed<Array<TreeFlatNode<V>>>(() => {
    const result: Array<TreeFlatNode<V>> = [];
    const walk = (
      list: Array<Record<string, unknown>>,
      depth: number,
      parentKey: V | null,
    ): void => {
      for (const raw of list) {
        const key = raw[fields.value] as V;
        const childList =
          (raw[fields.children] as Array<Record<string, unknown>> | undefined) ?? [];
        const childKeys = childList.map((child) => child[fields.value] as V);
        const leafKeys: V[] = [];
        if (childList.length === 0) {
          leafKeys.push(key);
        } else {
          // 递归填充当前节点的全部后代叶子
          const collect = (children: Array<Record<string, unknown>>): void => {
            for (const child of children) {
              const grandchildren =
                (child[fields.children] as Array<Record<string, unknown>> | undefined) ?? [];
              if (grandchildren.length === 0) leafKeys.push(child[fields.value] as V);
              else collect(grandchildren);
            }
          };
          collect(childList);
        }
        // isLeaf 字段显式标注时优先（true=叶子，false=远程懒加载父节点）；
        // 未标注时回退到“无子级即叶子”
        const leafFlag = raw[fields.isLeaf];
        const isLeaf = leafFlag === undefined ? childList.length === 0 : leafFlag === true;
        result.push({
          key,
          label: String(raw[fields.label] ?? ''),
          depth,
          disabled: Boolean(raw[fields.disabled]),
          isLeaf,
          parentKey,
          childKeys,
          leafKeys,
          raw,
        });
        walk(childList, depth + 1, key);
      }
    };
    walk(toValue(data), 0, null);
    return result;
  });

  const getNode = (key: V) => flatNodes.value.find((node) => node.key === key);

  // 2. 展开集合
  const expandedModel = useControllableModel<V[]>({
    modelValue: expandedProp,
    defaultValue: defaultExpandedKeys,
    fallback: [],
    onChange: onExpandedChange,
  });
  const expandedKeys = expandedModel.value as Ref<V[]>;

  const isExpanded = (key: V) => expandedKeys.value.includes(key);

  const setExpanded = (key: V, expanded: boolean) => {
    const set = new Set(expandedKeys.value);
    if (expanded) set.add(key);
    else set.delete(key);
    expandedKeys.value = Array.from(set);
  };

  const toggleExpand = (key: V) => setExpanded(key, !isExpanded(key));

  const expandAll = () => {
    expandedKeys.value = flatNodes.value.filter((node) => !node.isLeaf).map((node) => node.key);
  };

  const collapseAll = () => {
    expandedKeys.value = [];
  };

  // 3. 可见节点：深度优先、按展开集合裁剪
  const visibleNodes = computed(() => {
    const all = flatNodes.value;
    if (all.length === 0) return [];
    const byParent = new Map<V | null, TreeFlatNode<V>[]>();
    for (const node of all) {
      const list = byParent.get(node.parentKey) ?? [];
      list.push(node);
      byParent.set(node.parentKey, list);
    }
    const visible: TreeFlatNode<V>[] = [];
    const pushLevel = (parentKey: V | null) => {
      for (const node of byParent.get(parentKey) ?? []) {
        visible.push(node);
        if (!node.isLeaf && isExpanded(node.key)) pushLevel(node.key);
      }
    };
    pushLevel(null);
    return visible;
  });

  // 4. 勾选集合（级联）
  const checkedModel = useControllableModel<V[]>({
    modelValue,
    defaultValue,
    fallback: [],
    onChange,
  });
  const checkedKeys = checkedModel.value as unknown as Ref<V[]>;
  const checkedSet = computed(() => new Set(checkedKeys.value));

  const isChecked = (key: V) => {
    const node = getNode(key);
    if (!node) return false;
    // 非级联模式只反映节点自身的勾选状态
    if (!cascade) return checkedSet.value.has(key);
    return node.leafKeys.every((leaf) => checkedSet.value.has(leaf));
  };

  const isIndeterminate = (key: V) => {
    if (!cascade) return false;
    const node = getNode(key);
    if (!node || node.isLeaf) return false;
    const count = node.leafKeys.filter((leaf) => checkedSet.value.has(leaf)).length;
    return count > 0 && count < node.leafKeys.length;
  };

  const halfCheckedKeys = computed(() =>
    flatNodes.value
      .filter((node) => !node.isLeaf && isIndeterminate(node.key))
      .map((node) => node.key),
  );

  const check = (key: V, checked?: boolean) => {
    const node = getNode(key);
    if (!node || node.disabled) return;
    const nextChecked = checked ?? !isChecked(key);
    // 级联传播跳过禁用叶子（禁用节点维持原状态），非级联只操作自身
    const affected = (cascade ? node.leafKeys : [key]).filter((k) => !getNode(k)?.disabled);
    const set = new Set(checkedKeys.value);
    if (nextChecked) affected.forEach((leaf) => set.add(leaf));
    else affected.forEach((leaf) => set.delete(leaf));
    checkedKeys.value = Array.from(set);
  };

  const setCheckedKeys = (keys: V[]) => {
    checkedKeys.value = [...keys];
  };

  return {
    flatNodes,
    visibleNodes,
    checkedKeys,
    expandedKeys,
    getNode,
    isExpanded,
    setExpanded,
    toggleExpand,
    expandAll,
    collapseAll,
    isChecked,
    isIndeterminate,
    halfCheckedKeys,
    check,
    setCheckedKeys,
  };
}
