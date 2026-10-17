import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useDateGrid } from '../../index';

describe('useDateGrid', () => {
  // 固定视角：2024-02（29 天，2 月 1 日为周四）
  const viewDate = ref(new Date(2024, 1, 15));

  it('输出 6×7 网格，含上下月填充', () => {
    const grid = useDateGrid({ viewDate, firstDayOfWeek: 1 });
    expect(grid.weeks.value).toHaveLength(6);
    expect(grid.weeks.value[0]).toHaveLength(7);

    // 周一起始：2024-02-01 周四 → 首行第 4 个（index 3）才是 2 月
    const firstRow = grid.weeks.value[0];
    expect(firstRow.slice(0, 3).every((c) => !c.inMonth)).toBe(true);
    expect(firstRow[3].date.getDate()).toBe(1);
    expect(firstRow[3].inMonth).toBe(true);

    // 29 号在第 5 行（index 4），第 6 行全部为下月填充
    expect(grid.weeks.value[5].every((c) => !c.inMonth)).toBe(true);
  });

  it('星期表头按 firstDayOfWeek 轮转', () => {
    const monday = useDateGrid({ viewDate, firstDayOfWeek: 1 });
    expect(monday.weekdayOrder.value).toEqual([1, 2, 3, 4, 5, 6, 0]);
    const sunday = useDateGrid({ viewDate, firstDayOfWeek: 0 });
    expect(sunday.weekdayOrder.value).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('周末、禁用、选中标记', () => {
    const grid = useDateGrid({
      viewDate,
      disabledDate: (d) => d.getDate() === 10,
      isSelected: (d) => d.getDate() === 15,
    });
    const weekendCells = grid.weeks.value.flat().filter((c) => c.inMonth && c.isWeekend);
    expect(weekendCells.length).toBeGreaterThan(0);
    const disabled = grid.weeks.value.flat().find((c) => c.inMonth && c.date.getDate() === 10)!;
    expect(disabled.disabled).toBe(true);
    const selected = grid.weeks.value.flat().find((c) => c.inMonth && c.date.getDate() === 15)!;
    expect(selected.selected).toBe(true);
  });

  it('月份/年份面板与标签', () => {
    const grid = useDateGrid({ viewDate });
    expect(grid.months.value.map((m) => m.label)).toEqual([
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ]);
    expect(grid.panelLabel.value).toBe('2024年 2月');
    grid.setPanelType('month');
    expect(grid.panelLabel.value).toBe('2024年');
    grid.setPanelType('year');
    expect(grid.panelLabel.value).toBe('2020 - 2029');
    const years = grid.years.value;
    expect(years[0].label).toBe('2019');
    expect(years[0].inPanel).toBe(false);
    expect(years.find((y) => y.label === '2024')!.inPanel).toBe(true);
  });

  it('prev/next 按月与按年切换视角', () => {
    const grid = useDateGrid({ viewDate: ref(new Date(2024, 0, 31)) });
    grid.nextView();
    expect(grid.viewDate.value.getMonth()).toBe(1);
    // 1 月 31 → 2 月（钳制到 29）再到 3 月保持同一天语义
    grid.nextView();
    expect(grid.viewDate.value.getMonth()).toBe(2);
    expect(grid.viewDate.value.getDate()).toBe(29);

    const yearView = useDateGrid({
      viewDate: ref(new Date(2024, 5, 1)),
      type: 'year',
    });
    yearView.prevView();
    expect(yearView.viewDate.value.getFullYear()).toBe(2014);
  });

  it('goToDate 直接跳转', () => {
    const grid = useDateGrid({ viewDate });
    grid.goToDate(new Date(2030, 10, 5));
    expect(grid.viewDate.value.getFullYear()).toBe(2030);
  });
});
