import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useSelectModel } from '../../index';
import type { SelectOption } from '../../index';
import { withScope } from '../helpers';

const OPTIONS: SelectOption<number>[] = [
  { value: 1, label: '苹果' },
  { value: 2, label: 'Banana' },
  { value: 3, label: 'Cherry', disabled: true },
];

describe('useSelectModel（单选）', () => {
  it('选中值、标签回显与重复选中无变化', () => {
    const ctx = withScope(() => useSelectModel<number>({ options: OPTIONS }));
    const changed = vi.fn();
    expect(ctx.selectedLabel.value).toBeUndefined();
    expect(ctx.selectOption(OPTIONS[0])).toBe(true);
    expect(ctx.model.value).toBe(1);
    expect(ctx.selectedLabel.value).toBe('苹果');
    expect(ctx.selectOption(OPTIONS[0])).toBe(false);
  });

  it('禁用项不可选', () => {
    const ctx = withScope(() => useSelectModel<number>({ options: OPTIONS }));
    expect(ctx.selectOption(OPTIONS[2])).toBe(false);
    expect(ctx.model.value).toBeNull();
  });

  it('clear 清空', () => {
    const ctx = withScope(() => useSelectModel<number>({ options: OPTIONS, defaultValue: 2 }));
    ctx.clear();
    expect(ctx.model.value).toBeNull();
  });

  it('本地过滤（默认大小写不敏感的 label 包含匹配）', () => {
    const ctx = withScope(() => useSelectModel<number>({ options: OPTIONS, filterable: true }));
    ctx.setKeyword('an');
    expect(ctx.filteredOptions.value.map((o) => o.value)).toEqual([2]);
    ctx.setKeyword('苹');
    expect(ctx.filteredOptions.value.map((o) => o.value)).toEqual([1]);
    ctx.setKeyword('');
    expect(ctx.filteredOptions.value).toHaveLength(3);
  });

  it('自定义 filterMethod', () => {
    const ctx = withScope(() =>
      useSelectModel<number>({
        options: OPTIONS,
        filterable: true,
        filterMethod: (option, word) => String(option.value) === word,
      }),
    );
    ctx.setKeyword('2');
    expect(ctx.filteredOptions.value.map((o) => o.value)).toEqual([2]);
  });
});

describe('useSelectModel（多选）', () => {
  it('数组增删、selectedOptions 回显与 removeValue', () => {
    const ctx = withScope(() => useSelectModel<number>({ options: OPTIONS, multiple: true }));
    ctx.selectOption(OPTIONS[0]);
    ctx.selectOption(OPTIONS[1]);
    expect(ctx.model.value).toEqual([1, 2]);
    expect(ctx.selectedOptions.value.map((o) => o.label)).toEqual(['苹果', 'Banana']);
    expect(ctx.isSelected(OPTIONS[1])).toBe(true);
    ctx.removeValue(1);
    expect(ctx.model.value).toEqual([2]);
  });

  it('受控值通过 options 响应式更新后可回显', () => {
    const options = ref<SelectOption<number>[]>([]);
    const ctx = withScope(() => useSelectModel<number>({ options, defaultValue: 9 }));
    expect(ctx.selectedOptions.value).toHaveLength(0);
    options.value = [{ value: 9, label: '后到的选项' }];
    expect(ctx.selectedLabel.value).toBe('后到的选项');
  });
});

describe('useSelectModel（已选快照）', () => {
  it('数据源翻页替换后，已选标签仍能回显', () => {
    const options = ref<SelectOption<number>[]>([{ value: 1, label: '苹果' }]);
    const ctx = withScope(() => useSelectModel<number>({ options, multiple: true }));
    ctx.selectOption(options.value[0]);
    expect(ctx.selectedLabel.value).toBe('苹果');
    // 模拟翻页：可见数据被替换为第二页，第一页选项已不在其中
    options.value = [{ value: 2, label: '香蕉' }];
    expect(ctx.model.value).toEqual([1]);
    expect(ctx.selectedOptions.value.map((o) => o.label)).toEqual(['苹果']);
  });

  it('服务端搜索排除原选项后，旧值与新值可共存', () => {
    const options = ref<SelectOption<number>[]>([{ value: 1, label: '苹果' }]);
    const ctx = withScope(() => useSelectModel<number>({ options, multiple: true }));
    ctx.selectOption(options.value[0]);
    // 搜索后数据源只剩另一个选项
    options.value = [{ value: 2, label: '香蕉' }];
    ctx.selectOption(options.value[0]);
    expect(ctx.selectedOptions.value.map((o) => o.label)).toEqual(['苹果', '香蕉']);
  });

  it('取消选中与 clear 会从快照移除', () => {
    const options = ref<SelectOption<number>[]>([
      { value: 1, label: '苹果' },
      { value: 2, label: '香蕉' },
    ]);
    const ctx = withScope(() => useSelectModel<number>({ options, multiple: true }));
    ctx.selectOption(options.value[0]);
    ctx.selectOption(options.value[1]);
    ctx.removeValue(1);
    // 数据源清空后，仅剩的已选值仍靠快照回显
    options.value = [];
    expect(ctx.selectedOptions.value.map((o) => o.label)).toEqual(['香蕉']);
    ctx.clear();
    expect(ctx.selectedOptions.value).toHaveLength(0);
  });

  it('未经 pick 的受控值不写入快照，数据源移除后不再回显', () => {
    const options = ref<SelectOption<number>[]>([{ value: 7, label: '外部值' }]);
    const ctx = withScope(() => useSelectModel<number>({ options, defaultValue: 7 }));
    expect(ctx.selectedLabel.value).toBe('外部值');
    // 未经 pick 无快照可依，只能依赖数据源，移除后即失去回显能力
    options.value = [];
    expect(ctx.selectedOptions.value).toHaveLength(0);
  });
});
