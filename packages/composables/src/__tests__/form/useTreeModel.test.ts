import { describe, expect, it } from 'vitest';
import { useTreeModel } from '../../index';
import { withScope } from '../helpers';

/**
 * 树结构：
 * 1
 * ├─ 11
 * │  ├─ 111（叶）
 * │  └─ 112（叶，禁用）
 * └─ 12（叶）
 * 2（叶）
 */
const DATA = [
  {
    value: 1,
    label: '1',
    children: [
      {
        value: 11,
        label: '11',
        children: [
          { value: 111, label: '111' },
          { value: 112, label: '112', disabled: true },
        ],
      },
      { value: 12, label: '12' },
    ],
  },
  { value: 2, label: '2' },
];

describe('useTreeModel', () => {
  it('扁平化：深度、父子关系与后代叶子集合', () => {
    const ctx = withScope(() => useTreeModel({ data: DATA }));
    const flat = ctx.flatNodes.value;
    expect(flat.map((n) => n.key)).toEqual([1, 11, 111, 112, 12, 2]);
    const node1 = ctx.getNode(1)!;
    expect(node1.depth).toBe(0);
    expect(node1.isLeaf).toBe(false);
    expect(node1.leafKeys).toEqual([111, 112, 12]);
    expect(ctx.getNode(111)!.parentKey).toBe(11);
  });

  it('展开集合控制可见节点（深度优先）', () => {
    const ctx = withScope(() => useTreeModel({ data: DATA, defaultExpandedKeys: [] }));
    expect(ctx.visibleNodes.value.map((n) => n.key)).toEqual([1, 2]);
    ctx.toggleExpand(1);
    expect(ctx.visibleNodes.value.map((n) => n.key)).toEqual([1, 11, 12, 2]);
    ctx.setExpanded(11, true);
    expect(ctx.visibleNodes.value.map((n) => n.key)).toEqual([1, 11, 111, 112, 12, 2]);
    ctx.collapseAll();
    expect(ctx.visibleNodes.value.map((n) => n.key)).toEqual([1, 2]);
    ctx.expandAll();
    expect(ctx.visibleNodes.value.map((n) => n.key)).toHaveLength(6);
  });

  it('级联勾选：禁用叶子维持原态，部分命中推导半选', () => {
    const ctx = withScope(() => useTreeModel({ data: DATA }));
    // 勾选 1：传播到 111/12，但 112 禁用保持未选，父节点因此半选
    ctx.check(1, true);
    expect(ctx.checkedKeys.value).toEqual([111, 12]);
    expect(ctx.isChecked(1)).toBe(false);
    expect(ctx.isIndeterminate(1)).toBe(true);
    expect(ctx.isIndeterminate(11)).toBe(true);

    // 取消 111：11 子树已无任何选中（112 禁用未选），仅 1 因 12 命中而半选
    ctx.check(111, false);
    expect(ctx.checkedKeys.value).toEqual([12]);
    expect(ctx.isIndeterminate(1)).toBe(true);
    expect(ctx.isIndeterminate(11)).toBe(false);
    expect(ctx.halfCheckedKeys.value).toEqual([1]);
  });

  it('禁用节点不可勾选，非级联只切换自身', () => {
    const ctx = withScope(() => useTreeModel({ data: DATA }));
    ctx.check(112, true);
    expect(ctx.checkedKeys.value).toEqual([]);

    const plain = withScope(() => useTreeModel({ data: DATA, cascade: false }));
    plain.check(11, true);
    expect(plain.checkedKeys.value).toEqual([11]);
    expect(plain.isChecked(11)).toBe(true);
  });

  it('setCheckedKeys 直接覆盖', () => {
    const ctx = withScope(() => useTreeModel({ data: DATA }));
    ctx.setCheckedKeys([12, 2]);
    expect(ctx.checkedKeys.value).toEqual([12, 2]);
  });
});
