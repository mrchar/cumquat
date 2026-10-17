import { describe, expect, it } from 'vitest';
import { useDateModel } from '../../index';
import { withScope } from '../helpers';

describe('useDateModel（单选）', () => {
  it('选择日期写入标准格式并回显', () => {
    const ctx = withScope(() => useDateModel());
    ctx.selectDate(new Date(2024, 5, 1));
    expect(ctx.model.value).toBe('2024-06-01');
    expect(ctx.displayText.value).toBe('2024-06-01');
    expect(ctx.isSelected(new Date(2024, 5, 1))).toBe(true);
  });

  it('min/max 边界外日期禁用且不可选', () => {
    const ctx = withScope(() => useDateModel({ minDate: '2024-06-05', maxDate: '2024-06-20' }));
    expect(ctx.isDisabled(new Date(2024, 5, 4))).toBe(true);
    expect(ctx.isDisabled(new Date(2024, 5, 21))).toBe(true);
    expect(ctx.isDisabled(new Date(2024, 5, 10))).toBe(false);
    ctx.selectDate(new Date(2024, 5, 1));
    expect(ctx.model.value).toBeNull();
  });

  it('外部 disabledDate 生效', () => {
    const ctx = withScope(() => useDateModel({ disabledDate: (d) => d.getDay() === 6 }));
    const saturday = new Date(2024, 5, 1);
    expect(saturday.getDay()).toBe(6);
    expect(ctx.isDisabled(saturday)).toBe(true);
  });

  it('粒度 month / year 的格式化', () => {
    const month = withScope(() =>
      useDateModel({ granularity: 'month', defaultValue: '2024-06-15' }),
    );
    expect(month.displayText.value).toBe('2024-06');
    const year = withScope(() => useDateModel({ granularity: 'year' }));
    year.selectDate(new Date(2024, 0, 1));
    expect(year.model.value).toBe('2024');
  });

  it('clear 清空选择', () => {
    const ctx = withScope(() => useDateModel({ defaultValue: '2024-01-01' }));
    ctx.clear();
    expect(ctx.model.value).toBeNull();
    expect(ctx.displayText.value).toBe('');
  });

  it('上一月/下一月切换视角', () => {
    const ctx = withScope(() => useDateModel({ defaultValue: '2024-01-15' }));
    ctx.prevMonth();
    expect(ctx.viewDate.value.getMonth()).toBe(11);
    ctx.nextMonth();
    expect(ctx.viewDate.value.getMonth()).toBe(0);
  });
});

describe('useDateModel（范围）', () => {
  it('两段式选择：先起后止，逆序自动交换', () => {
    const ctx = withScope(() => useDateModel({ range: true }));
    ctx.selectDate(new Date(2024, 5, 10));
    expect(ctx.rangeModel.value).toEqual(['2024-06-10', null]);
    expect(ctx.isRangeStart(new Date(2024, 5, 10))).toBe(true);
    ctx.selectDate(new Date(2024, 5, 20));
    expect(ctx.rangeModel.value).toEqual(['2024-06-10', '2024-06-20']);
    expect(ctx.isInRange(new Date(2024, 5, 15))).toBe(true);
    expect(ctx.isInRange(new Date(2024, 5, 9))).toBe(false);
    expect(ctx.displayText.value).toBe('2024-06-10 ~ 2024-06-20');

    // 完成一轮后重新选择，逆序选择自动交换
    ctx.selectDate(new Date(2024, 5, 18));
    ctx.selectDate(new Date(2024, 5, 8));
    expect(ctx.rangeModel.value).toEqual(['2024-06-08', '2024-06-18']);
  });

  it('选择中悬停预览区间', () => {
    const ctx = withScope(() => useDateModel({ range: true }));
    ctx.selectDate(new Date(2024, 5, 10));
    ctx.setHoverDate(new Date(2024, 5, 15));
    expect(ctx.isInRange(new Date(2024, 5, 12))).toBe(true);
    expect(ctx.isInRange(new Date(2024, 5, 16))).toBe(false);

    // 反向悬停同样预览
    ctx.setHoverDate(new Date(2024, 5, 5));
    expect(ctx.isInRange(new Date(2024, 5, 7))).toBe(true);
  });

  it('快捷范围项直接写入区间', () => {
    const ctx = withScope(() =>
      useDateModel({
        range: true,
        shortcuts: [
          {
            label: '六月上半月',
            value: [new Date(2024, 5, 1), new Date(2024, 5, 15)],
          },
        ],
      }),
    );
    ctx.selectShortcut({
      label: '六月上半月',
      value: [new Date(2024, 5, 1), new Date(2024, 5, 15)],
    });
    expect(ctx.rangeModel.value).toEqual(['2024-06-01', '2024-06-15']);
  });

  it('clear 复位范围与两段式状态', () => {
    const ctx = withScope(() => useDateModel({ range: true }));
    ctx.selectDate(new Date(2024, 5, 1));
    ctx.clear();
    expect(ctx.rangeModel.value).toBeNull();
    // 可重新开始第一段选择
    ctx.selectDate(new Date(2024, 5, 2));
    expect(ctx.rangeModel.value).toEqual(['2024-06-02', null]);
  });
});
