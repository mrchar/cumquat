import { describe, expect, it, vi } from 'vitest';
import { useTimeModel } from '../../index';
import { withScope } from '../helpers';

describe('useTimeModel', () => {
  it('初值解析为时/分/秒并回显', () => {
    const ctx = withScope(() => useTimeModel({ defaultValue: '08:30:45' }));
    expect(ctx.hour.value).toBe(8);
    expect(ctx.minute.value).toBe(30);
    expect(ctx.second.value).toBe(45);
    expect(ctx.displayText.value).toBe('08:30:45');
  });

  it('步进列：hourStep/minuteStep/secondStep 过滤', () => {
    const ctx = withScope(() => useTimeModel({ hourStep: 6, minuteStep: 15, secondStep: 30 }));
    expect(ctx.hourColumn.value.map((i) => i.value)).toEqual([0, 6, 12, 18]);
    expect(ctx.minuteColumn.value.map((i) => i.value)).toEqual([0, 15, 30, 45]);
    expect(ctx.secondColumn.value.map((i) => i.value)).toEqual([0, 30]);
    expect(ctx.hourColumn.value[0].label).toBe('00');
  });

  it('无秒列时 confirm 输出 HH:mm', () => {
    const onChange = vi.fn();
    const ctx = withScope(() => useTimeModel({ useSeconds: false, onChange }));
    ctx.setHour(9);
    ctx.setMinute(5);
    const text = ctx.confirm();
    expect(text).toBe('09:05');
    expect(ctx.model.value).toBe('09:05');
    expect(onChange).toHaveBeenCalledWith('09:05');
  });

  it('时间范围禁用候选项', () => {
    const ctx = withScope(() =>
      useTimeModel({
        defaultValue: '12:00:00',
        minTime: '09:00:00',
        maxTime: '18:00:00',
      }),
    );
    const hour8 = ctx.hourColumn.value.find((i) => i.value === 8)!;
    const hour10 = ctx.hourColumn.value.find((i) => i.value === 10)!;
    expect(hour8.disabled).toBe(true);
    expect(hour10.disabled).toBe(false);
    // 越过范围的设置被忽略
    ctx.setUnit('hour', 7);
    expect(ctx.hour.value).toBe(12);
  });

  it('clear 复位并发出 null', () => {
    const onChange = vi.fn();
    const ctx = withScope(() => useTimeModel({ defaultValue: '10:00:00', onChange }));
    ctx.clear();
    expect(ctx.hour.value).toBeNull();
    expect(ctx.displayText.value).toBe('');
    expect(ctx.model.value).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('confirm 在未选完整时返回 null', () => {
    const ctx = withScope(() => useTimeModel());
    ctx.setHour(10);
    expect(ctx.confirm()).toBeNull();
    expect(ctx.model.value).toBeNull();
  });
});
