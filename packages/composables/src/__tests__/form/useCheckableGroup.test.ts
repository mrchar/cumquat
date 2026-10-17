import { describe, expect, it, vi } from 'vitest';
import { useCheckableGroup } from '../../index';
import { withScope } from '../helpers';

describe('useCheckableGroup（多选）', () => {
  it('勾选 / 取消与 isChecked', () => {
    const ctx = withScope(() => useCheckableGroup<string>({ defaultValue: ['a'] }));
    expect(ctx.isChecked('a')).toBe(true);
    ctx.select('b', true);
    expect(ctx.model.value).toEqual(['a', 'b']);
    ctx.toggle('a');
    expect(ctx.model.value).toEqual(['b']);
  });

  it('全选 / 半选推导（禁用项不参与）', () => {
    const ctx = withScope(() =>
      useCheckableGroup<string>({
        defaultValue: ['a'],
        options: () => ['a', 'b', 'c', 'd'],
        isOptionDisabled: (v) => v === 'd',
      }),
    );
    expect(ctx.allChecked.value).toBe(false);
    expect(ctx.indeterminate.value).toBe(true);
    ctx.toggleAll(true);
    expect(ctx.allChecked.value).toBe(true);
    expect(ctx.model.value).toEqual(['a', 'b', 'c']);
    ctx.toggleAll(false);
    expect(ctx.model.value).toEqual([]);
    expect(ctx.allChecked.value).toBe(false);
  });

  it('max 约束阻止继续勾选，min 约束阻止取消', () => {
    const ctx = withScope(() =>
      useCheckableGroup<string>({
        defaultValue: ['a', 'b'],
        options: () => ['a', 'b', 'c'],
        min: 1,
        max: 2,
      }),
    );
    ctx.select('c', true);
    expect(ctx.model.value).toEqual(['a', 'b']);
    ctx.select('a', false);
    ctx.select('b', false);
    expect(ctx.checkedCount.value).toBe(1);
  });
});

describe('useCheckableGroup（单选）', () => {
  it('互斥替换，checked=false 不改变', () => {
    const onChange = vi.fn();
    const ctx = withScope(() =>
      useCheckableGroup<string>({
        multiple: false,
        defaultValue: 'x',
        onChange,
      }),
    );
    expect(ctx.isChecked('x')).toBe(true);
    ctx.select('y');
    expect(ctx.model.value).toBe('y');
    expect(onChange).toHaveBeenCalledWith('y');
    ctx.select('z', false);
    expect(ctx.model.value).toBe('y');
  });
});
